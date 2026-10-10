import json


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
}



def _read_payload(event):
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

    payload = _read_payload(event or {})
    prompt = payload.get("prompt", "How can I save more on AWS?")

    response = {
        "message": "AI agent ready",
        "prompt": prompt,
        "recommendations": [
            "Review non-production instances and scale them down outside peak hours.",
            "Move infrequently accessed data to lower-cost storage classes.",
            "Turn off demo or idle workloads and use auto-scaling for predictable traffic."
        ],
        "confidence": "medium",
        "status": "ok"
    }

    return {
        "statusCode": 200,
        "headers": {**CORS_HEADERS, "Content-Type": "application/json"},
        "body": json.dumps(response)
    }
