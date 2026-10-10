output "aws_account_id" {
  description = "AWS account the stack was deployed into."
  value       = local.account_id
}

output "api_gateway_invoke_url" {
  description = "Base URL for the API Gateway. Frontend uses this as VITE_API_URL."
  value       = aws_api_gateway_stage.prod.invoke_url
}

output "api_key_id" {
  description = "ID of the API Gateway API key."
  value       = aws_api_gateway_api_key.client.id
  sensitive   = true
}

output "cost_retriever_function_name" {
  description = "Name of the Cost Retriever Lambda."
  value       = aws_lambda_function.cost_retriever.function_name
}

output "resource_manager_function_name" {
  description = "Name of the Resource Manager Lambda."
  value       = aws_lambda_function.resource_manager.function_name
}

output "ai_agent_function_name" {
  description = "Name of the AI Agent Lambda."
  value       = aws_lambda_function.ai_agent.function_name
}

output "state_bucket_name" {
  description = "S3 bucket used for app state (idempotency, sessions)."
  value       = aws_s3_bucket.app_state.bucket
}
