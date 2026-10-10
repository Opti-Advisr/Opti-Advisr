terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "ap-south-1"
}

variable "project_name" {
  type    = string
  default = "opti-advisr"
}

variable "lambda_runtime" {
  type    = string
  default = "python3.12"
}

variable "cost_retriever_zip" {
  type    = string
  default = "../backend/lambdas/cost_retriever.zip"
}

variable "resource_manager_zip" {
  type    = string
  default = "../backend/lambdas/resource_manager.zip"
}

variable "ai_agent_zip" {
  type    = string
  default = "../backend/lambdas/ai_agent.zip"
}

variable "api_stage_name" {
  type    = string
  default = "v1"
}

variable "create_demo_resources" {
  type    = bool
  default = false
}

variable "db_username" {
  type      = string
  sensitive = true
  default   = null
}

variable "db_password" {
  type      = string
  sensitive = true
  default   = null
}

data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

locals {
  tags = {
    Project     = "costopt"
    Application = "Opti Advisr"
    ManagedBy   = "Terraform"
  }

  lambdas = {
    costs = {
      name    = "${var.project_name}-cost-retriever"
      zip     = var.cost_retriever_zip
      timeout = 30
      memory  = 256
    }
    resources = {
      name    = "${var.project_name}-resource-manager"
      zip     = var.resource_manager_zip
      timeout = 30
      memory  = 256
    }
    agent = {
      name    = "${var.project_name}-ai-agent"
      zip     = var.ai_agent_zip
      timeout = 60
      memory  = 512
    }
  }
}

resource "random_id" "suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "app_data" {
  bucket = "${var.project_name}-app-data-${random_id.suffix.hex}"
  tags   = local.tags
}

resource "aws_s3_bucket" "agent_data" {
  bucket = "${var.project_name}-agent-data-${random_id.suffix.hex}"
  tags   = local.tags
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket                  = aws_s3_bucket.app_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_public_access_block" "agent_data" {
  bucket                  = aws_s3_bucket.agent_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role" "lambda" {
  for_each = local.lambdas
  name     = "${each.value.name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "logs" {
  for_each   = local.lambdas
  role       = aws_iam_role.lambda[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "cost_read" {
  name = "${var.project_name}-cost-explorer-read"
  role = aws_iam_role.lambda["costs"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["ce:GetCostAndUsage", "ce:GetDimensionValues"]
      Resource = "*"
    }]
  })
}

resource "aws_iam_role_policy" "resource_manager" {
  name = "${var.project_name}-resource-manager-policy"
  role = aws_iam_role.lambda["resources"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ec2:DescribeInstances", "ec2:DescribeInstanceStatus", "ec2:DescribeTags", "ec2:StartInstances", "ec2:StopInstances", "ec2:TerminateInstances"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["rds:DescribeDBInstances", "rds:StartDBInstance", "rds:StopDBInstance"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListAllMyBuckets", "s3:ListBucket", "s3:GetBucketLocation"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = ["${aws_s3_bucket.app_data.arn}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy" "agent_read_only" {
  name = "${var.project_name}-agent-read-only"
  role = aws_iam_role.lambda["agent"].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ce:GetCostAndUsage", "ce:GetDimensionValues"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["ec2:DescribeInstances", "ec2:DescribeInstanceStatus", "rds:DescribeDBInstances", "s3:ListAllMyBuckets", "s3:ListBucket", "s3:GetBucketLocation"]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:PutObject"]
        Resource = ["${aws_s3_bucket.agent_data.arn}/*"]
      }
    ]
  })
}

resource "aws_lambda_function" "backend" {
  for_each         = local.lambdas
  function_name    = each.value.name
  role             = aws_iam_role.lambda[each.key].arn
  runtime          = var.lambda_runtime
  handler          = "handler.lambda_handler"
  filename         = each.value.zip
  source_code_hash = filebase64sha256(each.value.zip)
  timeout          = each.value.timeout
  memory_size      = each.value.memory

  environment {
    variables = {
      PROJECT_NAME             = var.project_name
      APP_DATA_BUCKET          = aws_s3_bucket.app_data.bucket
      AGENT_DATA_BUCKET        = aws_s3_bucket.agent_data.bucket
      RESOURCE_TAG_KEY         = "Project"
      RESOURCE_TAG_VALUE       = "costopt"
      AWS_COST_EXPLORER_REGION = "us-east-1"
    }
  }

  tags = local.tags

  depends_on = [aws_iam_role_policy_attachment.logs]
}

resource "aws_api_gateway_rest_api" "api" {
  name = "${var.project_name}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = local.tags
}

resource "aws_api_gateway_resource" "costs" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "costs"
}

resource "aws_api_gateway_resource" "resources" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "resources"
}

resource "aws_api_gateway_resource" "agent" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "agent"
}

resource "aws_api_gateway_method" "costs_post" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.costs.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_method" "resources_get" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.resources.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true

  request_parameters = {
    "method.request.querystring.type" = true
  }
}

resource "aws_api_gateway_method" "resources_post" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.resources.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_method" "agent_post" {
  rest_api_id      = aws_api_gateway_rest_api.api.id
  resource_id      = aws_api_gateway_resource.agent.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_method" "costs_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.costs.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "costs_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.costs.id
  http_method = aws_api_gateway_method.costs_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "costs_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.costs.id
  http_method = aws_api_gateway_method.costs_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "costs_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.costs.id
  http_method = aws_api_gateway_method.costs_options.http_method
  status_code = aws_api_gateway_method_response.costs_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,x-api-key'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_method" "resources_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.resources.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "resources_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.resources.id
  http_method = aws_api_gateway_method.resources_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "resources_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.resources.id
  http_method = aws_api_gateway_method.resources_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "resources_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.resources.id
  http_method = aws_api_gateway_method.resources_options.http_method
  status_code = aws_api_gateway_method_response.resources_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,x-api-key'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_method" "agent_options" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.agent.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "agent_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.agent.id
  http_method = aws_api_gateway_method.agent_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "agent_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.agent.id
  http_method = aws_api_gateway_method.agent_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

resource "aws_api_gateway_integration_response" "agent_options" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.agent.id
  http_method = aws_api_gateway_method.agent_options.http_method
  status_code = aws_api_gateway_method_response.agent_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,x-api-key'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

locals {
  integrations = {
    costs_post = {
      resource_id = aws_api_gateway_resource.costs.id
      method      = "POST"
      lambda_key  = "costs"
    }
    resources_get = {
      resource_id = aws_api_gateway_resource.resources.id
      method      = "GET"
      lambda_key  = "resources"
    }
    resources_post = {
      resource_id = aws_api_gateway_resource.resources.id
      method      = "POST"
      lambda_key  = "resources"
    }
    agent_post = {
      resource_id = aws_api_gateway_resource.agent.id
      method      = "POST"
      lambda_key  = "agent"
    }
  }
}

resource "aws_api_gateway_integration" "lambda" {
  for_each = local.integrations

  rest_api_id             = aws_api_gateway_rest_api.api.id
  resource_id             = each.value.resource_id
  http_method             = each.value.method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.backend[each.value.lambda_key].invoke_arn

  depends_on = [
    aws_api_gateway_method.costs_post,
    aws_api_gateway_method.resources_get,
    aws_api_gateway_method.resources_post,
    aws_api_gateway_method.agent_post,
  ]
}

resource "aws_lambda_permission" "api_gateway" {
  for_each = local.lambdas

  statement_id  = "AllowApiGateway-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_method.costs_post.id,
      aws_api_gateway_method.resources_get.id,
      aws_api_gateway_method.resources_post.id,
      aws_api_gateway_method.agent_post.id,
      aws_api_gateway_method.costs_options.id,
      aws_api_gateway_method.resources_options.id,
      aws_api_gateway_method.agent_options.id,
      aws_api_gateway_integration.lambda,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [aws_api_gateway_integration.lambda]
}

resource "aws_api_gateway_stage" "api" {
  deployment_id = aws_api_gateway_deployment.api.id
  rest_api_id   = aws_api_gateway_rest_api.api.id
  stage_name    = var.api_stage_name
  tags          = local.tags
}

resource "aws_api_gateway_api_key" "frontend" {
  name    = "${var.project_name}-frontend-key"
  enabled = true
  tags    = local.tags
}

resource "aws_api_gateway_usage_plan" "frontend" {
  name = "${var.project_name}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.api.id
    stage  = aws_api_gateway_stage.api.stage_name
  }

  throttle_settings {
    burst_limit = 20
    rate_limit  = 10
  }

  quota_settings {
    limit  = 10000
    period = "MONTH"
  }

  tags = local.tags
}

resource "aws_api_gateway_usage_plan_key" "frontend" {
  key_id        = aws_api_gateway_api_key.frontend.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.frontend.id
}

# Optional demo EC2/RDS are disabled by default to avoid unexpected charges.
resource "aws_instance" "demo" {
  count         = var.create_demo_resources ? 1 : 0
  ami           = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"
  tags          = merge(local.tags, { Name = "${var.project_name}-demo-ec2" })
}

resource "aws_security_group" "rds" {
  count       = var.create_demo_resources ? 1 : 0
  name        = "${var.project_name}-demo-rds-sg"
  description = "RDS demo security group; no inbound access is opened by default."
  vpc_id      = data.aws_vpc.default.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.tags
}

resource "aws_db_subnet_group" "demo" {
  count      = var.create_demo_resources ? 1 : 0
  name       = "${var.project_name}-demo-db-subnets"
  subnet_ids = slice(data.aws_subnets.default.ids, 0, min(2, length(data.aws_subnets.default.ids)))
  tags       = local.tags
}

resource "aws_db_instance" "demo" {
  count                  = var.create_demo_resources ? 1 : 0
  identifier             = "${var.project_name}-demo-db"
  engine                 = "postgres"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  storage_type           = "gp3"
  db_name                = "optiadvisr"
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.demo[0].name
  vpc_security_group_ids = [aws_security_group.rds[0].id]
  publicly_accessible    = false
  skip_final_snapshot    = true
  deletion_protection    = false

  lifecycle {
    precondition {
      condition     = var.db_username != null && var.db_password != null
      error_message = "Set TF_VAR_db_username and TF_VAR_db_password before enabling create_demo_resources."
    }

    precondition {
      condition     = length(data.aws_subnets.default.ids) >= 2
      error_message = "The default VPC must have at least two subnets for RDS."
    }
  }

  tags = local.tags
}

output "api_base_url" {
  value = "https://${aws_api_gateway_rest_api.api.id}.execute-api.${var.aws_region}.amazonaws.com/${aws_api_gateway_stage.api.stage_name}"
}

output "api_key_id" {
  description = "API key ID only; do not commit the API key value."
  value       = aws_api_gateway_api_key.frontend.id
}

output "lambda_names" {
  value = { for key, fn in aws_lambda_function.backend : key => fn.function_name }
}

output "app_data_bucket" {
  value = aws_s3_bucket.app_data.bucket
}

output "agent_data_bucket" {
  value = aws_s3_bucket.agent_data.bucket
}

