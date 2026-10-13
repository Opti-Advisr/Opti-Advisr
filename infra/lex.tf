# OptiAdvisor Lex bot.
# Lex is not available in ap-south-1, so the bot lives in ap-southeast-1
# through an aliased provider. Everything else stays in ap-south-1.
# The advisor Lambda reads the matched intent name from RecognizeText and
# composes the data reply itself. Lambda fulfillment can be attached per
# intent once the fulfillment Lambda exists in ap-southeast-1.

provider "aws" {
  alias  = "singapore"
  region = "ap-southeast-1"

  default_tags {
    tags = {
      Project     = "costopt"
      Application = "Opti Advisr"
      ManagedBy   = "Terraform"
    }
  }
}

resource "aws_iam_role" "lex_bot" {
  provider = aws.singapore
  name     = "${var.project_name}-lex-bot-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lexv2.amazonaws.com" }
    }]
  })

  tags = local.tags
}

resource "aws_lexv2models_bot" "advisor" {
  provider = aws.singapore
  name     = "OptiAdvisor"
  role_arn = aws_iam_role.lex_bot.arn

  data_privacy {
    child_directed = false
  }

  idle_session_ttl_in_seconds = 300

  tags = local.tags
}

resource "aws_lexv2models_bot_locale" "en_us" {
  provider    = aws.singapore
  bot_id      = aws_lexv2models_bot.advisor.id
  bot_version = "DRAFT"
  locale_id   = "en_US"

  n_lu_intent_confidence_threshold = 0.4

  voice_settings {
    voice_id = "Joanna"
  }
}

resource "aws_lexv2models_intent" "fallback" {
  provider                = aws.singapore
  bot_id                  = aws_lexv2models_bot.advisor.id
  bot_version             = "DRAFT"
  locale_id               = aws_lexv2models_bot_locale.en_us.locale_id
  name                    = "FallbackIntent"
  parent_intent_signature = "AMAZON.FallbackIntent"
}

resource "aws_lexv2models_intent" "cost_summary" {
  provider    = aws.singapore
  bot_id      = aws_lexv2models_bot.advisor.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.en_us.locale_id
  name        = "CostSummary"

  sample_utterance { utterance = "How much did I spend this month" }
  sample_utterance { utterance = "What is my total AWS cost" }
  sample_utterance { utterance = "Show my cost summary" }
  sample_utterance { utterance = "How much am I spending on AWS" }

}

resource "aws_lexv2models_intent" "find_idle" {
  provider    = aws.singapore
  bot_id      = aws_lexv2models_bot.advisor.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.en_us.locale_id
  name        = "FindIdleResources"

  sample_utterance { utterance = "Which resources are idle" }
  sample_utterance { utterance = "Find idle EC2 instances" }
  sample_utterance { utterance = "What can I stop to save money" }
  sample_utterance { utterance = "Show me wasted resources" }

}

resource "aws_lexv2models_intent" "budget_status" {
  provider    = aws.singapore
  bot_id      = aws_lexv2models_bot.advisor.id
  bot_version = "DRAFT"
  locale_id   = aws_lexv2models_bot_locale.en_us.locale_id
  name        = "BudgetStatus"

  sample_utterance { utterance = "How am I tracking against budget" }
  sample_utterance { utterance = "What is my budget status" }
  sample_utterance { utterance = "How much of my budget is left" }

}

output "lex_bot_id" {
  value = aws_lexv2models_bot.advisor.id
}

output "lex_bot_arn" {
  value = aws_lexv2models_bot.advisor.arn
}
