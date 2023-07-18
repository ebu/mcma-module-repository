locals {
  token_name            = "token"
  token_handler         = "${local.token_name}.handler"
  token_zip             = "${local.function_dir}/${local.token_name}.zip"
}

resource "aws_lambda_function" "token" {
  filename         = local.token_zip
  function_name    = "module-repository-github-oidc-${local.token_name}-${var.region}-${var.environment_type}"
  handler          = local.token_handler
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = filebase64sha256(local.token_zip)
  runtime          = "nodejs18.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = local.env_vars
  }

  tags = var.default_tags
}

resource "aws_apigatewayv2_integration" "token" {
  api_id                 = aws_apigatewayv2_api.oidc_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.token.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "token_get" {
  api_id             = aws_apigatewayv2_api.oidc_api.id
  route_key          = "GET /token"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.token.id}"
}

resource "aws_apigatewayv2_route" "token_post" {
  api_id             = aws_apigatewayv2_api.oidc_api.id
  route_key          = "POST /token"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.token.id}"
}

resource "aws_lambda_permission" "token" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.token.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.oidc_api.execution_arn}/*"
}