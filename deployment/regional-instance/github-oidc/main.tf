terraform {
  required_version = ">= 1.3.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.34.0"
    }
  }
}

locals {
  function_dir = "./regional-instance/github-oidc"
  env_vars     = {
    GITHUB_CLIENT_ID     = var.github_client_id
    GITHUB_CLIENT_SECRET = var.github_client_secret
    COGNITO_REDIRECT_URI = "https://${var.auth_subdomain}.${var.parent_domain}/oauth2/idpresponse"

    GITHUB_API_URL   = "https://github.com"
    GITHUB_LOGIN_URL = "https://api.github.com"
  }
  regional_domain_name = "${var.github_oidc_subdomain}-${var.region}-${var.environment_type}.${var.parent_domain}"
  regional_base_url    = "https://${local.regional_domain_name}/"
  global_domain_name   = "${var.github_oidc_subdomain}.${var.parent_domain}"
  global_url           = "https://${local.global_domain_name}/"
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
  name   = "module-repository-github-oidc-lambda-cloudwatch-access-${var.region}-${var.environment_type}"
  policy = data.aws_iam_policy_document.lambda_cloudwatch_access.json
}

resource "aws_iam_role" "lambda_role" {
  name               = "module-repository-github-oidc-${var.region}-${var.environment_type}-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy_doc.json
}

resource "aws_iam_role_policy_attachment" "lambda_role_cloudwatch_access" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_cloudwatch_access.arn
}

resource "aws_apigatewayv2_api" "oidc_api" {
  name          = "module-repository-github-oidc-api"
  description   = "MCMA Module Repository GitHub OpenID Connect API"
  protocol_type = "HTTP"

  tags = var.default_tags
}

resource "aws_apigatewayv2_stage" "oidc_api_stage" {
  depends_on  = [
    aws_apigatewayv2_route.authorize,
    aws_apigatewayv2_route.openid_config,
    aws_apigatewayv2_route.jwks,
    aws_apigatewayv2_route.token_get,
    aws_apigatewayv2_route.token_post,
    aws_apigatewayv2_route.userinfo_get,
    aws_apigatewayv2_route.userinfo_post
  ]
  api_id      = aws_apigatewayv2_api.oidc_api.id
  name        = var.environment_type
  auto_deploy = true

  tags = var.default_tags
}

resource "aws_apigatewayv2_domain_name" "regional_domain_name" {
  domain_name = local.regional_domain_name

  domain_name_configuration {
    certificate_arn = var.cert_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "regional_domain_name_mapping" {
  api_id          = aws_apigatewayv2_api.oidc_api.id
  domain_name     = aws_apigatewayv2_domain_name.regional_domain_name.id
  stage           = aws_apigatewayv2_stage.oidc_api_stage.id
}

resource "aws_apigatewayv2_domain_name" "global_domain_name" {
  domain_name = local.global_domain_name

  domain_name_configuration {
    certificate_arn = var.cert_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_api_mapping" "global_domain_name_mapping" {
  api_id          = aws_apigatewayv2_api.oidc_api.id
  domain_name     = aws_apigatewayv2_domain_name.global_domain_name.id
  stage           = aws_apigatewayv2_stage.oidc_api_stage.id
}

resource "aws_route53_record" "dns_record" {
  name    = aws_apigatewayv2_domain_name.regional_domain_name.domain_name
  type    = "A"
  zone_id = var.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.regional_domain_name.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.regional_domain_name.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "github_oidc" {
  name           = local.global_domain_name
  zone_id        = var.zone_id
  set_identifier = "${var.region}-${var.environment_type}"
  type           = "CNAME"
  ttl            = "300"
  records        = [local.regional_domain_name]

  latency_routing_policy {
    region = var.region
  }
}
