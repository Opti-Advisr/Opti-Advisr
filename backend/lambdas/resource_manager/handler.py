import json
import os
import boto3

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}


def _safe_list(value):
    return value if isinstance(value, list) else []


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


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    region = os.environ.get("AWS_REGION", "ap-south-1")
    ec2 = boto3.client("ec2", region_name=region)
    rds = boto3.client("rds", region_name=region)
    s3 = boto3.client("s3")

    method = event.get("httpMethod", "GET")

    # Handle action on POST
    if method == "POST":
        body = _load_body(event)
        action = body.get("action")
        resource_id = body.get("resource_id")
        resource_type = body.get("resource_type", "ec2")

        if action and resource_id:
            try:
                if resource_type == "ec2":
                    if action == "start":
                        ec2.start_instances(InstanceIds=[resource_id])
                    elif action == "stop":
                        ec2.stop_instances(InstanceIds=[resource_id])
                    elif action == "terminate":
                        ec2.terminate_instances(InstanceIds=[resource_id])
                elif resource_type == "rds":
                    if action == "start":
                        rds.start_db_instance(DBInstanceIdentifier=resource_id)
                    elif action == "stop":
                        rds.stop_db_instance(DBInstanceIdentifier=resource_id)

                return {
                    "statusCode": 200,
                    "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                    "body": json.dumps({
                        "success": True,
                        "action": action,
                        "resource_id": resource_id,
                        "message": f"Successfully performed {action} on {resource_id}"
                    })
                }
            except Exception as e:
                return {
                    "statusCode": 200,
                    "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
                    "body": json.dumps({
                        "success": False,
                        "action": action,
                        "resource_id": resource_id,
                        "error": str(e)
                    })
                }

    # Query resources
    payload = event.get("queryStringParameters") if isinstance(event, dict) else {}
    resource_type = (payload or {}).get("type", "all")

    resources = {
        "instances": [],
        "databases": [],
        "buckets": []
    }

    # Search in ap-south-1 (primary) and us-east-1
    regions_to_check = list(set([region, "us-east-1"]))
    for r in regions_to_check:
        try:
            r_ec2 = boto3.client("ec2", region_name=r)
            for reservation in _safe_list(r_ec2.describe_instances().get("Reservations", [])):
                for instance in _safe_list(reservation.get("Instances", [])):
                    inst_id = instance.get("InstanceId")
                    if not any(i["id"] == inst_id for i in resources["instances"]):
                        resources["instances"].append({
                            "id": inst_id,
                            "type": instance.get("InstanceType"),
                            "state": instance.get("State", {}).get("Name"),
                            "region": r,
                            "tags": instance.get("Tags", [])
                        })
        except Exception:
            pass

        try:
            r_rds = boto3.client("rds", region_name=r)
            for db in _safe_list(r_rds.describe_db_instances().get("DBInstances", [])):
                db_id = db.get("DBInstanceIdentifier")
                if not any(d["id"] == db_id for d in resources["databases"]):
                    resources["databases"].append({
                        "id": db_id,
                        "class": db.get("DBInstanceClass"),
                        "status": db.get("DBInstanceStatus"),
                        "region": r
                    })
        except Exception:
            pass

    try:
        for bucket in _safe_list(s3.list_buckets().get("Buckets", [])):
            resources["buckets"].append({
                "name": bucket.get("Name"),
                "creation_date": bucket.get("CreationDate").isoformat() if bucket.get("CreationDate") else None
            })
    except Exception:
        pass

    if resource_type != "all":
        resources = {resource_type: resources.get(resource_type, [])}

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps({
            "message": "Resource manager ready",
            "resource_type": resource_type,
            "resources": resources
        })
    }
