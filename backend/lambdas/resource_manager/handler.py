import json

import boto3


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}



def _safe_list(value):
    return value if isinstance(value, list) else []


def lambda_handler(event, context):
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    payload = event.get("queryStringParameters") if isinstance(event, dict) else {}
    resource_type = (payload or {}).get("type", "all")

    ec2 = boto3.client("ec2", region_name="us-east-1")
    rds = boto3.client("rds", region_name="us-east-1")
    s3 = boto3.client("s3", region_name="us-east-1")

    resources = {
        "instances": [],
        "databases": [],
        "buckets": []
    }

    try:
        for reservation in _safe_list(ec2.describe_instances().get("Reservations", [])):
            for instance in _safe_list(reservation.get("Instances", [])):
                resources["instances"].append({
                    "id": instance.get("InstanceId"),
                    "type": instance.get("InstanceType"),
                    "state": instance.get("State", {}).get("Name"),
                    "tags": instance.get("Tags", [])
                })
    except Exception:
        resources["instances"] = []

    try:
        for db in _safe_list(rds.describe_db_instances().get("DBInstances", [])):
            resources["databases"].append({
                "id": db.get("DBInstanceIdentifier"),
                "class": db.get("DBInstanceClass"),
                "status": db.get("DBInstanceStatus")
            })
    except Exception:
        resources["databases"] = []

    try:
        for bucket in _safe_list(s3.list_buckets().get("Buckets", [])):
            resources["buckets"].append({
                "name": bucket.get("Name"),
                "creation_date": bucket.get("CreationDate").isoformat() if bucket.get("CreationDate") else None
            })
    except Exception:
        resources["buckets"] = []

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
