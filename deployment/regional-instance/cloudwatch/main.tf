terraform {
  required_version = ">= 1.3.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.34"
    }
  }
}

data "aws_iam_policy_document" "cloudwatch_assume_role" {
  statement {
    effect  = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = [
        "apigateway.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_role" "cloudwatch_access" {
  name               = "api-gateway-cloudwatch-${var.region}-${var.environment_type}"
  assume_role_policy = data.aws_iam_policy_document.cloudwatch_assume_role.json
}

data "aws_iam_policy_document" "cloudwatch_access" {
  statement {
    effect    = "Allow"
    actions   = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:FilterLogEvents"
    ]
    resources = [
      "*"
    ]
  }
}

resource "aws_iam_role_policy" "cloudwatch_access" {
  name     = "api-gateway-cloudwatch-${var.region}-${var.environment_type}"
  role     = aws_iam_role.cloudwatch_access.id
  policy   = data.aws_iam_policy_document.cloudwatch_access.json
}

resource "aws_api_gateway_account" "module_repository_api_account" {
  cloudwatch_role_arn = aws_iam_role.cloudwatch_access.arn
}