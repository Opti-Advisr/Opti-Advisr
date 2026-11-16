import json
import os
from datetime import datetime, timedelta

import boto3


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}

TAG_KEY = os.environ.get("RESOURCE_TAG_KEY", "Project")
TAG_VALUE = os.environ.get("RESOURCE_TAG_VALUE", "costopt")

# Frontend uses resource_type values ec2/rds/s3; the API contract uses
# type=ec2|rds|s3 on GET and service on POST. Both are accepted.
TYPE_ALIASES = {
    "ec2": "ec2", "instances": "ec2", "instance": "ec2",
    "rds": "rds", "databases": "rds", "database": "rds", "db": "rds",
    "s3": "s3", "buckets": "s3", "bucket": "s3",
}


def _respond(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(payload),
    }


def _error(status_code, message):
    return _respond(status_code, {"status": "error", "message": message})


def _load_body(event):
    body = event.get("body") if isinstance(event, dict) else None
    if isinstance(body, str):
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {}
    if isinstance(body, dict):
        return body
    return {}


def _tag_value(tags, key):
    for tag in tags or []:
        if tag.get("Key") == key:
            return tag.get("Value")
    return None


def _has_project_tag(tags):
    return _tag_value(tags, TAG_KEY) == TAG_VALUE


def _is_idle_ec2(cloudwatch, instance_id):
    """Idle candidate: average CPU under 5% across the last 7 days."""
    try:
        stats = cloudwatch.get_metric_statistics(
            Namespace="AWS/EC2",
            MetricName="CPUUtilization",
            Dimensions=[{"Name": "InstanceId", "Value": instance_id}],
            StartTime=datetime.utcnow() - timedelta(days=7),
            EndTime=datetime.utcnow(),
            Period=7 * 24 * 3600,
            Statistics=["Average"],
        )
        points = stats.get("Datapoints", [])
        if not points:
            return False
        return float(points[0].get("Average", 100.0)) < 5.0
    except Exception:
        return False


def _list_ec2(region, cloudwatch):
    ec2 = boto3.client("ec2", region_name=region)
    items = []
    response = ec2.describe_instances(
        Filters=[{"Name": f"tag:{TAG_KEY}", "Values": [TAG_VALUE]}]
    )
    for reservation in response.get("Reservations", []):
        for instance in reservation.get("Instances", []):
            tags = instance.get("Tags", [])
            state = instance.get("State", {}).get("Name")
            items.append({
                "id": instance.get("InstanceId"),
                "name": _tag_value(tags, "Name") or instance.get("InstanceId"),
                "state": state,
                "size": instance.get("InstanceType"),
                "type": instance.get("InstanceType"),
                "region": region,
                "tags": tags,
                "idle_candidate": state == "running" and _is_idle_ec2(cloudwatch, instance.get("InstanceId")),
            })
    return items


def _list_rds(region):
    rds = boto3.client("rds", region_name=region)
    items = []
    for db in rds.describe_db_instances().get("DBInstances", []):
        try:
            tag_list = rds.list_tags_for_resource(ResourceName=db.get("DBInstanceArn", "")).get("TagList", [])
        except Exception:
            tag_list = []
        tags = [{"Key": t.get("Key"), "Value": t.get("Value")} for t in tag_list]
        if not _has_project_tag(tags):
            continue
        items.append({
            "id": db.get("DBInstanceIdentifier"),
            "name": db.get("DBInstanceIdentifier"),
            "state": db.get("DBInstanceStatus"),
            "status": db.get("DBInstanceStatus"),
            "size": db.get("DBInstanceClass"),
            "class": db.get("DBInstanceClass"),
            "region": region,
            "tags": tags,
        })
    return items


def _list_s3():
    s3 = boto3.client("s3")
    items = []
    for bucket in s3.list_buckets().get("Buckets", []):
        name = bucket.get("Name")
        try:
            tagging = s3.get_bucket_tagging(Bucket=name)
            tags = [{"Key": t.get("Key"), "Value": t.get("Value")} for t in tagging.get("TagSet", [])]
        except Exception:
            tags = []
        if not _has_project_tag(tags):
            continue
        items.append({
            "id": name,
            "name": name,
            "state": "available",
            "size": None,
            "creation_date": bucket.get("CreationDate").isoformat() if bucket.get("CreationDate") else None,
            "tags": tags,
        })
    return items


def _check_ec2_tag(ec2, resource_id):
    response = ec2.describe_instances(InstanceIds=[resource_id])
    for reservation in response.get("Reservations", []):
        for instance in reservation.get("Instances", []):
            return _has_project_tag(instance.get("Tags", []))
    return False


def _check_rds_tag(rds, resource_id):
    response = rds.describe_db_instances(DBInstanceIdentifier=resource_id)
    for db in response.get("DBInstances", []):
        tag_list = rds.list_tags_for_resource(ResourceName=db.get("DBInstanceArn", "")).get("TagList", [])
        tags = [{"Key": t.get("Key"), "Value": t.get("Value")} for t in tag_list]
        if _has_project_tag(tags):
            return True
    return False


def _handle_action(region, body):
    action = body.get("action")
    resource_id = body.get("resource_id")
    raw_type = body.get("service") or body.get("resource_type") or "ec2"
    resource_type = TYPE_ALIASES.get(str(raw_type).lower())

    if not action or not resource_id:
        return _error(400, "action and resource_id are required")
    if resource_type is None:
        return _error(400, "service must be one of ec2, rds, s3")
    if body.get("confirm") is not True:
        return _error(400, "confirm must be true to perform this action")

    try:
        if resource_type == "ec2":
            ec2 = boto3.client("ec2", region_name=region)
            if not _check_ec2_tag(ec2, resource_id):
                return _error(403, f"Resource {resource_id} is not tagged {TAG_KEY}={TAG_VALUE}; action refused")
            if action == "start":
                ec2.start_instances(InstanceIds=[resource_id])
                new_state = "pending"
            elif action == "stop":
                ec2.stop_instances(InstanceIds=[resource_id])
                new_state = "stopping"
            elif action == "terminate":
                ec2.terminate_instances(InstanceIds=[resource_id])
                new_state = "shutting-down"
            else:
                return _error(400, f"Unsupported action for ec2: {action}")
        elif resource_type == "rds":
            rds = boto3.client("rds", region_name=region)
            if not _check_rds_tag(rds, resource_id):
                return _error(403, f"Resource {resource_id} is not tagged {TAG_KEY}={TAG_VALUE}; action refused")
            if action == "start":
                rds.start_db_instance(DBInstanceIdentifier=resource_id)
                new_state = "starting"
            elif action == "stop":
                rds.stop_db_instance(DBInstanceIdentifier=resource_id)
                new_state = "stopping"
            else:
                return _error(400, f"Unsupported action for rds: {action}")
        else:
            return _error(400, "Actions are not supported for s3 buckets")
    except Exception:
        return _error(502, f"AWS could not perform {action} on {resource_id}. Check the resource state and try again.")

    return _respond(200, {
        "status": "ok",
        "success": True,
        "message": f"Successfully performed {action} on {resource_id}",
        "action": action,
        "resource_id": resource_id,
        "new_state": new_state,
    })


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    region = os.environ.get("AWS_REGION", "ap-south-1")
    method = event.get("httpMethod", "GET")

    if method == "POST":
        return _handle_action(region, _load_body(event))

    params = event.get("queryStringParameters") or {}
    raw_type = params.get("type", "all")
    if raw_type == "all":
        wanted = ["ec2", "rds", "s3"]
    else:
        normalized = TYPE_ALIASES.get(str(raw_type).lower())
        if normalized is None:
            return _error(400, "type must be one of ec2, rds, s3")
        wanted = [normalized]

    cloudwatch = boto3.client("cloudwatch", region_name=region)
    grouped = {"instances": [], "databases": [], "buckets": []}
    items = []
    try:
        if "ec2" in wanted:
            grouped["instances"] = _list_ec2(region, cloudwatch)
        if "rds" in wanted:
            grouped["databases"] = _list_rds(region)
        if "s3" in wanted:
            grouped["buckets"] = _list_s3()
    except Exception:
        return _error(502, "Could not list resources from AWS right now. Please try again shortly.")

    items = grouped["instances"] + grouped["databases"] + grouped["buckets"]

    return _respond(200, {
        "status": "ok",
        "type": raw_type,
        "items": items,
        # Grouped shape the current dashboard reads:
        "message": "Resources listed",
        "resource_type": raw_type,
        "resources": grouped,
    })
