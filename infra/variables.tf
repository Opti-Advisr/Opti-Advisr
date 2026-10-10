variable "project_name" {
  description = "Prefix for all resource names."
  type        = string
  default     = "opti-advisr"
}

variable "environment" {
  description = "Deployment environment (dev, prod)."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1"
}

variable "project_tag" {
  description = "Value of the Project tag. The Resource Manager Lambda only acts on resources carrying this tag."
  type        = string
  default     = "costopt"
}

variable "api_key_value" {
  description = "API Gateway API key value sent as the x-api-key header by the frontend."
  type        = string
  sensitive   = true
}

variable "budget_limit_monthly" {
  description = "Monthly budget limit in USD for the sprint budget."
  type        = number
  default     = 10
}

variable "alert_email" {
  description = "Email address for budget alert notifications."
  type        = string
  default     = ""
}

variable "demo_ec2_instance_type" {
  description = "Instance type for the demo EC2 instance."
  type        = string
  default     = "t3.micro"
}

variable "demo_rds_instance_class" {
  description = "Instance class for the demo RDS database."
  type        = string
  default     = "db.t3.micro"
}
