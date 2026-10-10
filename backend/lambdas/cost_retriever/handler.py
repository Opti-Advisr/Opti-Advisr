import json
import os
from datetime import datetime

import boto3


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}



def _load_payload(event):
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

    payload = _load_payload(event or {})
    period = payload.get("period", "monthly")
    metric = payload.get("metric", "cost")
    now = datetime.utcnow()
    start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    data = {
        "period": period,
        "metric": metric,
        "message": "Cost retriever ready",
        "window": {
            "start": start.isoformat(),
            "end": now.isoformat(),
        },
        "amount": 0,
        "currency": "USD"
    }

    try:
        client = boto3.client("ce", region_name="us-east-1")
        response = client.get_cost_and_usage(
            TimePeriod={
                "Start": start.strftime("%Y-%m-%d"),
                "End": now.strftime("%Y-%m-%d")
            },
            Granularity="MONTHLY",
            Metrics=["BlendedCost"],
            GroupBy=[{"Type": "DIMENSION", "Key": "SERVICE"}]
        )
        results = response.get("ResultsByTime", [])
        if results:
            total = results[-1].get("Total", {}).get("BlendedCost", {}).get("Amount", "0")
            data["amount"] = float(total)
            data["services"] = [
                {
                    "service": item.get("Keys", ["unknown"])[0],
                    "amount": item.get("Metrics", {}).get("BlendedCost", {}).get("Amount", "0")
                }
                for item in results[-1].get("Groups", [])
            ]
    except Exception:
        data["demo"] = True
        data["message"] = "Using demo cost data because Cost Explorer access is temporarily unavailable."

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(data)
    }
