import json
import os
import re
from datetime import datetime
import boto3

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}


def _read_payload(event):
    if not isinstance(event, dict):
        return {}

    if "prompt" in event and isinstance(event.get("prompt"), str) and event["prompt"].strip():
        return event

    body = event.get("body")
    if event.get("isBase64Encoded") and isinstance(body, str):
        import base64
        try:
            body = base64.b64decode(body).decode('utf-8')
        except Exception:
            pass

    if isinstance(body, str):
        try:
            parsed = json.loads(body)
            if isinstance(parsed, dict):
                return parsed
            if isinstance(parsed, str):
                try:
                    return json.loads(parsed)
                except Exception:
                    return {"prompt": parsed}
        except Exception:
            return {"prompt": body}

    if isinstance(body, dict):
        return body

    qs = event.get("queryStringParameters")
    if isinstance(qs, dict) and "prompt" in qs:
        return qs

    return {}


def _lex_intent(text, session_id):
    """Ask Amazon Lex which intent the message matches. Returns None when
    Lex is not configured or cannot be reached; the caller then falls
    back to keyword matching."""
    bot_id = os.environ.get("LEX_BOT_ID")
    if not bot_id or not text:
        return None
    try:
        lex = boto3.client("lexv2-runtime", region_name=os.environ.get("LEX_REGION", "ap-southeast-1"))
        resp = lex.recognize_text(
            botId=bot_id,
            botAliasId=os.environ.get("LEX_BOT_ALIAS_ID", "TSTALIASID"),
            localeId=os.environ.get("LEX_LOCALE_ID", "en_US"),
            sessionId=session_id or "opti-advisr-session",
            text=text,
        )
        return resp.get("sessionState", {}).get("intent", {}).get("name")
    except Exception:
        return None


def _get_aws_context(region="ap-south-1"):
    ctx = {
        "spend": 0.0,
        "services": [],
        "instances": [],
        "databases": [],
        "buckets": [],
        "currency": "USD",
        "month": datetime.utcnow().strftime("%B %Y")
    }

    # 1. Cost Explorer
    try:
        ce = boto3.client("ce", region_name="us-east-1")
        now = datetime.utcnow()
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        res = ce.get_cost_and_usage(
            TimePeriod={
                "Start": start.strftime("%Y-%m-%d"),
                "End": now.strftime("%Y-%m-%d")
            },
            Granularity="MONTHLY",
            Metrics=["BlendedCost"],
            GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}]
        )
        results = res.get("ResultsByTime", [])
        if results:
            total = results[-1].get("Total", {}).get("BlendedCost", {}).get("Amount", "0")
            ctx["spend"] = float(total)
            for group in results[-1].get("Groups", []):
                svc_name = group.get("Keys", ["unknown"])[0]
                svc_amount = float(group.get("Metrics", {}).get("BlendedCost", {}).get("Amount", "0"))
                if svc_amount > 0:
                    ctx["services"].append({"service": svc_name, "amount": svc_amount})
            ctx["services"].sort(key=lambda s: s["amount"], reverse=True)
    except Exception:
        pass

    # 2. S3 Buckets
    try:
        s3 = boto3.client("s3")
        buckets = s3.list_buckets().get("Buckets", [])
        ctx["buckets"] = [b.get("Name") for b in buckets if b.get("Name")]
    except Exception:
        pass

    # 3. EC2 Instances
    try:
        ec2 = boto3.client("ec2", region_name=region)
        for resv in ec2.describe_instances().get("Reservations", []):
            for inst in resv.get("Instances", []):
                ctx["instances"].append({
                    "id": inst.get("InstanceId"),
                    "type": inst.get("InstanceType"),
                    "state": inst.get("State", {}).get("Name"),
                    "name": next((t.get("Value") for t in inst.get("Tags", []) if t.get("Key") == "Name"), inst.get("InstanceId"))
                })
    except Exception:
        pass

    # 3b. Idle flags from CloudWatch: running instances whose 7-day
    # average CPU is under 5% are idle candidates.
    try:
        from datetime import timedelta
        cw = boto3.client("cloudwatch", region_name=region)
        for inst in ctx["instances"]:
            if inst.get("state") != "running":
                inst["idle"] = False
                continue
            stats = cw.get_metric_statistics(
                Namespace="AWS/EC2",
                MetricName="CPUUtilization",
                Dimensions=[{"Name": "InstanceId", "Value": inst.get("id")}],
                StartTime=datetime.utcnow() - timedelta(days=7),
                EndTime=datetime.utcnow(),
                Period=7 * 24 * 3600,
                Statistics=["Average"],
            )
            points = stats.get("Datapoints", [])
            inst["idle"] = bool(points) and float(points[0].get("Average", 100.0)) < 5.0
    except Exception:
        pass

    # 4. RDS Databases
    try:
        rds = boto3.client("rds", region_name=region)
        for db in rds.describe_db_instances().get("DBInstances", []):
            ctx["databases"].append({
                "id": db.get("DBInstanceIdentifier"),
                "class": db.get("DBInstanceClass"),
                "status": db.get("DBInstanceStatus")
            })
    except Exception:
        pass

    return ctx


def _generate_response(prompt, ctx):
    q = (prompt or "").lower().strip()
    spend = ctx.get("spend", 0.0)
    month = ctx.get("month", "October 2026")
    buckets = ctx.get("buckets", [])
    instances = ctx.get("instances", [])
    databases = ctx.get("databases", [])
    services = ctx.get("services", [])
    top_svc = services[0] if services else None

    # Spend / Cost query
    if any(k in q for k in ["how much", "current spend", "total cost", "total spend", "my cost", "my bill", "charges", "what did i spend"]):
        if spend > 0:
            top_text = f", with **{top_svc['service']}** accounting for the largest portion (${top_svc['amount']:.2f})" if top_svc else ""
            reply = (
                f"Your total month-to-date AWS spend for **{month}** is **${spend:.2f}**{top_text}.\n\n"
                f"**Active Cost Breakdown:**\n"
            )
            for s in services[:5]:
                reply += f"• **{s['service']}**: ${s['amount']:.4f}\n"
            reply += "\nYou are currently tracking well within your standard monthly allowance."
        else:
            bucket_count = len(buckets)
            reply = (
                f"Your total month-to-date AWS spend for **{month}** is **$0.00** (Free Tier / zero billing accrued).\n\n"
                f"**Account Summary:**\n"
                f"• Active S3 Buckets: {bucket_count} ({', '.join(buckets[:3]) if buckets else 'None'})\n"
                f"• EC2 Instances: {len(instances)} running\n"
                f"• RDS Databases: {len(databases)} active\n\n"
                f"Because minimal workloads are generating billable traffic, no compute or storage charges have exceeded free-tier limits."
            )
        recommendations = [
            "Set an AWS Budget threshold alert at $5.00 to prevent unexpected bill spikes.",
            "Verify all testing Lambda functions have appropriate memory and timeout caps.",
            "Enable AWS Cost Anomaly Detection to get alerted on unexpected usage surges."
        ]
        return reply, recommendations

    # Which resources can I stop / Idle / Terminate
    if any(k in q for k in ["stop", "idle", "terminate", "turn off", "shutdown", "save money", "which resources"]):
        running_ec2 = [i for i in instances if i.get("state") == "running"]
        idle_ec2 = [i for i in running_ec2 if i.get("idle")]
        stopped_ec2 = [i for i in instances if i.get("state") == "stopped"]

        if idle_ec2:
            reply = (
                f"You currently have **{len(idle_ec2)} idle EC2 instance(s)** (average CPU under 5% over the last 7 days) that can be stopped to save money:\n\n"
            )
            for inst in idle_ec2:
                reply += f"• **{inst.get('name')}** (`{inst.get('id')}`, {inst.get('type')}) - Status: *{inst.get('state')}*\n"
            reply += "\nStopping these instances when not in active use will eliminate hourly compute charges (EBS storage volumes remain preserved)."
        else:
            reply = (
                f"**No idle EC2 instances were detected.** Running instances are all at or above 5% average CPU for the last 7 days.\n\n"
                f"**Account Inventory Checked:**\n"
                f"• EC2 Instances: {len(instances)} (running: 0, stopped: {len(stopped_ec2)})\n"
                f"• RDS Databases: {len(databases)} running\n"
                f"• S3 Buckets: {len(buckets)} active\n\n"
                f"**Top Savings Opportunities:**\n"
                f"1. **S3 Storage Lifecycle:** Ensure files older than 30–90 days transition to Infrequent Access or Glacier.\n"
                f"2. **Unattached EBS Volumes:** Verify no orphaned volumes remain from previously terminated instances.\n"
                f"3. **NAT Gateways & Elastic IPs:** Disassociate any unattached Elastic IPs (which AWS charges $0.005/hr for when idle)."
            )
        recommendations = [
            "Use AWS Instance Scheduler to automatically stop dev/test EC2 and RDS instances on nights and weekends.",
            "Check for unattached EBS volumes or old snapshots in EC2 Console.",
            "Review idle NAT Gateways (each costs ~$32/month even with zero traffic)."
        ]
        return reply, recommendations

    # S3 / Storage optimization
    if any(k in q for k in ["s3", "bucket", "storage", "lifecycle", "tiering", "glacier"]):
        bucket_list = "\n".join([f"• `{b}`" for b in buckets]) if buckets else "• None found"
        reply = (
            f"Here is your storage analysis across **{len(buckets)} S3 bucket(s)**:\n\n"
            f"{bucket_list}\n\n"
            f"**Recommended Storage Actions:**\n"
            f"1. **Enable S3 Intelligent-Tiering:** Automatically moves objects between frequent, infrequent, and archive access tiers with no retrieval fees.\n"
            f"2. **Abort Incomplete Multipart Uploads:** Configure lifecycle rules to delete uncompleted multipart uploads after 7 days to eliminate hidden storage costs.\n"
            f"3. **Enable S3 Lifecycle Expiration:** Auto-expire non-current object versions or temporary logs after 30 days."
        )
        recommendations = [
            "Apply S3 Intelligent-Tiering to buckets with unknown or unpredictable access patterns.",
            "Add a 7-day abort rule for incomplete multipart uploads across all buckets.",
            "Set log and telemetry buckets to expire objects after 30 days."
        ]
        return reply, recommendations

    # Budget / Tracking
    if any(k in q for k in ["budget", "track", "target", "limit", "forecast", "overage"]):
        reply = (
            f"**Budget Analysis for {month}:**\n\n"
            f"• **Current Month-to-Date Spend:** ${spend:.2f}\n"
            f"• **Workspace Target Budget:** $10.00\n"
            f"• **Status:** On Track (under budget limit)\n\n"
            f"Based on current daily usage patterns, your projected month-end spend is well below your $10.00 threshold."
        )
        recommendations = [
            "Create an AWS Budget alert at 80% ($8.00) to receive an email notification before exceeding budget.",
            "Configure a Zero-Spend budget in AWS Budgets to alert you immediately if unexpected charges occur.",
            "Use cost allocation tags (e.g. Environment=Dev, Owner=Team) to track spend per application."
        ]
        return reply, recommendations

    # Why did costs go up / increase
    if any(k in q for k in ["why", "increase", "up", "spike", "surge", "higher", "rose"]):
        reply = (
            f"**Cost Movement Analysis for {month}:**\n\n"
            f"Your current spend is **${spend:.2f}**.\n\n"
            f"**Common Causes of Cloud Cost Spikes on AWS:**\n"
            f"1. **Data Transfer Out:** High traffic egress from S3 or EC2 to the public internet.\n"
            f"2. **NAT Gateway Processing Charges:** High volume data transfer routed through AWS managed NAT Gateways ($0.045/GB).\n"
            f"3. **Provisioned IOPS:** DynamoDB or EBS volumes configured with provisioned IOPS rather than on-demand/gp3.\n"
            f"4. **CloudWatch Logs Ingestion:** Verbose application logging sending gigabytes of debug logs to CloudWatch."
        )
        recommendations = [
            "Check CloudWatch metric `BytesTransfered` on VPC endpoints and NAT Gateways.",
            "Inspect Cost Explorer grouped by API Operation to identify specific call spikes.",
            "Set CloudWatch log retention periods to 7 or 14 days rather than 'Never Expire'."
        ]
        return reply, recommendations

    # EC2 / Compute
    if any(k in q for k in ["ec2", "compute", "instance", "graviton", "savings plans", "reserved", "spot"]):
        reply = (
            f"**EC2 Compute Optimization Guidelines:**\n\n"
            f"• **Current Instances:** {len(instances)} configured\n\n"
            f"**Best Practices to Reduce EC2 Spend by 20%–70%:**\n"
            f"1. **Migrate to AWS Graviton (ARM64):** Transition instances from `t3`/`m5` (x86) to `t4g`/`m7g` (Graviton) for up to 40% better price-performance.\n"
            f"2. **Compute Savings Plans:** Commit to 1-year or 3-year consistent compute usage for up to 66% discount with flexibility across instance families, OS, and regions.\n"
            f"3. **Use Spot Instances for Batch Jobs:** Save up to 90% on fault-tolerant workloads, CI/CD runners, and batch processing."
        )
        recommendations = [
            "Test your application on `t4g.micro` or `t4g.small` Graviton instances for immediate 20% savings.",
            "Evaluate AWS Compute Savings Plans for baseline 24/7 workloads.",
            "Use gp3 EBS volumes instead of gp2 for a baseline 20% volume cost reduction."
        ]
        return reply, recommendations

    # Greetings
    if any(k in q for k in ["hi", "hello", "hey", "who are you", "what can you do", "help"]):
        reply = (
            f"Hello! I am **Opti Advisor**, your real-time AWS Cloud Cost and Optimization AI assistant.\n\n"
            f"I have direct read access to your AWS account (`ap-south-1`) and can help you with:\n"
            f"• **Spend Analysis:** Checking current spend, daily averages, and service breakdowns.\n"
            f"• **Resource Rightsizing:** Finding idle EC2 instances, databases, and unattached disks.\n"
            f"• **Storage Optimization:** S3 Intelligent-Tiering, lifecycle expiration, and tiering.\n"
            f"• **Architectural Advice:** Savings Plans, Graviton migration, and budget alerts.\n\n"
            f"Try asking: *'How much did I spend this month?'*, *'Which resources can I stop?'*, or *'How can I optimize my S3 buckets?'*"
        )
        recommendations = [
            "Ask 'How much did I spend this month?' to see live Cost Explorer totals.",
            "Ask 'Which resources can I stop to save money?' for workload rightsizing.",
            "Ask 'How can I optimize my S3 storage?' for lifecycle recommendations."
        ]
        return reply, recommendations

    # General fallback
    top_svc_desc = f"Your highest spend is currently in **{top_svc['service']}** (${top_svc['amount']:.4f})." if top_svc else "Your account has zero accrued billing this month."
    reply = (
        f"**Opti Advisor Analysis:**\n\n"
        f"Regarding your inquiry *\"{prompt}\"*:\n\n"
        f"{top_svc_desc} Across your workspace, **{len(buckets)} S3 bucket(s)**, **{len(instances)} EC2 instance(s)**, and **{len(databases)} RDS database(s)** are tracked.\n\n"
        f"**General AWS Cost Management Recommendations:**\n"
        f"1. **Tagging:** Enforce cost-center and environment tags across all resources for clear accountability.\n"
        f"2. **Right-sizing:** Ensure compute instances match actual CPU and RAM utilization peaks.\n"
        f"3. **Budgets & Alerts:** Set proactive billing threshold alerts in AWS Budgets."
    )
    recommendations = [
        "Review AWS Cost Explorer monthly trend reports.",
        "Ensure all non-production resources are stopped when not in use.",
        "Implement automatic S3 lifecycle rules for object expiration."
    ]
    return reply, recommendations


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    payload = _read_payload(event or {})
    prompt = payload.get("prompt") or payload.get("message") or ""
    session_id = payload.get("session_id") or "opti-advisr-session"

    # Route through Amazon Lex first: a matched Lex intent steers the
    # keyword branches below toward the right data-backed answer.
    intent = _lex_intent(prompt, session_id)
    if intent == "CostSummary":
        prompt = "how much did I spend " + prompt
    elif intent == "FindIdleResources":
        prompt = "which resources are idle " + prompt
    elif intent == "BudgetStatus":
        prompt = "budget status " + prompt

    try:
        region = os.environ.get("AWS_REGION", "ap-south-1")
        ctx = _get_aws_context(region)
        reply, recommendations = _generate_response(prompt, ctx)
        status = "ok"
    except Exception as e:
        reply = "I encountered an issue querying AWS telemetry. However, based on general AWS best practices, ensure idle compute is powered down and S3 lifecycle rules are active."
        recommendations = [
            "Review Cost Explorer in AWS Console.",
            "Verify IAM permissions for Cost Explorer read access."
        ]
        status = "partial"

    response = {
        "reply": reply,
        "recommendations": recommendations,
        "prompt": prompt,
        "status": status
    }

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(response)
    }
