terraform {
  required_version = ">= 1.3.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.34"
    }
  }
}

locals {
  regional_domain_name = "${var.subdomain}-${var.region}-${var.environment_type}.${var.parent_domain}"
  regional_base_url    = "https://${local.regional_domain_name}/"
  global_domain_name   = "${var.subdomain}.${var.parent_domain}"
  global_url           = "https://${local.global_domain_name}/"
  modules_base_url     = "https://${local.global_domain_name}/api/modules"
}

data "aws_iam_policy_document" "lambda_assume_role_policy_doc" {
  statement {
    effect  = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = [
        "lambda.amazonaws.com"
      ]
    }
  }
}

data "aws_iam_policy_document" "lambda_cloudwatch_access" {
  statement {
    effect    = "Allow"
    actions   = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:PutLogEvents"
    ]
    resources = [
      "*"
    ]
  }
}

resource "aws_iam_policy" "lambda_cloudwatch_access" {
  name   = "module-repository-lambda-cloudwatch-access-${var.region}-${var.environment_type}"
  policy = data.aws_iam_policy_document.lambda_cloudwatch_access.json
}

data "aws_iam_policy_document" "worker_lambda_access_policy" {
  statement {
    effect    = "Allow"
    actions   = [
      "lambda:InvokeFunction"
    ]
    resources = [
      aws_lambda_function.worker.arn
    ]
  }
}

resource "aws_iam_policy" "worker_lambda_access" {
  name   = "module-repository-worker-lambda-access-${var.region}-${var.environment_type}"
  policy = data.aws_iam_policy_document.worker_lambda_access_policy.json
}