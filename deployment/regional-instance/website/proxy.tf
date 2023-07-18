locals {
  regional_domain_name = "${var.subdomain}-${var.region}-${var.environment_type}.${var.parent_domain}"
  global_domain_name   = "${var.subdomain}.${var.parent_domain}"
}

resource "aws_apigatewayv2_api" "website_proxy" {
  name          = "mcma-module-repository-website-proxy-${var.region}-${var.environment_type}"
  description   = "Module Repository UI Proxy"
  protocol_type = "HTTP"
  tags          = var.default_tags
}

resource "aws_apigatewayv2_integration" "website_proxy" {
  api_id             = aws_apigatewayv2_api.website_proxy.id
  connection_type    = "INTERNET"
  integration_type   = "HTTP_PROXY"
  integration_method = "GET"
  integration_uri    = "http://${local.website_bucket_name}.s3-website-${var.region}.amazonaws.com/{proxy}"

  response_parameters {
    status_code = 404
    mappings    = {
      "overwrite:statuscode" = "200"
    }
  }
}

resource "aws_apigatewayv2_route" "website_proxy" {
  api_id             = aws_apigatewayv2_api.website_proxy.id
  route_key          = "GET /{proxy+}"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.website_proxy.id}"
}

##########################
# PUSH CLI TOKENS
##########################

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

resource "aws_iam_role" "push_cli_tokens" {
  name               = "module-repository-push-cli-tokens-${var.region}-${var.environment_type}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy_doc.json
}

data "aws_iam_policy_document" "websocket_api_access" {
  statement {
    effect  = "Allow"
    actions = [
      "execute-api:Invoke",
      "execute-api:ManageConnections"
    ]
    resources = [
      "${var.auth_ws_api_arn}/${var.environment_type}/POST/@connections/*"
    ]
  }
}

resource "aws_iam_policy" "websocket_api_access" {
  name   = "module-repository-push-cli-tokens-${var.region}-${var.environment_type}-ws-access"
  policy = data.aws_iam_policy_document.websocket_api_access.json
}

resource "aws_iam_role_policy_attachment" "websocket_api_access" {
  role       = aws_iam_role.push_cli_tokens.name
  policy_arn = aws_iam_policy.websocket_api_access.arn
}

data "aws_iam_policy_document" "cloudwatch_access" {
  statement {
    effect  = "Allow"
    actions = [
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

resource "aws_iam_policy" "cloudwatch_access" {
  name   = "module-repository-push-cli-tokens-lambda-cloudwatch-access-${var.region}-${var.environment_type}"
  policy = data.aws_iam_policy_document.cloudwatch_access.json
}

resource "aws_iam_role_policy_attachment" "cloudwatch_access" {
  role       = aws_iam_role.push_cli_tokens.name
  policy_arn = aws_iam_policy.cloudwatch_access.arn
}

resource "aws_lambda_function" "push_cli_tokens" {
  filename         = "../service/push-cli-tokens/build/dist/lambda.zip"
  function_name    = "module-repository-auth-push-cli-tokens-${var.region}-${var.environment_type}"
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../service/push-cli-tokens/build/dist/lambda.zip")
  role             = aws_iam_role.push_cli_tokens.arn
  runtime          = "nodejs18.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = {
      AuthWsDomain = var.auth_ws_domain
      LogGroupName = var.log_group
    }
  }

  tags = var.default_tags
}

resource "aws_lambda_permission" "push_cli_tokens" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.push_cli_tokens.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.website_proxy.execution_arn}/*"
}

resource "aws_apigatewayv2_integration" "push_cli_tokens" {
  api_id                 = aws_apigatewayv2_api.website_proxy.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.push_cli_tokens.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "push_cli_tokens" {
  api_id             = aws_apigatewayv2_api.website_proxy.id
  route_key          = "POST /auth-callback/{connectionId}"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.push_cli_tokens.id}"
}

resource "aws_apigatewayv2_stage" "website_proxy" {
  depends_on = [
    aws_apigatewayv2_route.website_proxy,
    aws_apigatewayv2_route.push_cli_tokens
  ]
  api_id      = aws_apigatewayv2_api.website_proxy.id
  name        = var.environment_type
  auto_deploy = true

  tags = var.default_tags
}

resource "aws_apigatewayv2_api_mapping" "regional_domain_name_mapping" {
  api_id      = aws_apigatewayv2_api.website_proxy.id
  domain_name = local.regional_domain_name
  stage       = aws_apigatewayv2_stage.website_proxy.id
}

resource "aws_apigatewayv2_api_mapping" "global_domain_name_mapping" {
  api_id      = aws_apigatewayv2_api.website_proxy.id
  domain_name = local.global_domain_name
  stage       = aws_apigatewayv2_stage.website_proxy.id
}