locals {
  authorize_name    = "authorize"
  authorize_handler = "${local.authorize_name}.handler"
  authorize_zip     = "${local.function_dir}/${local.authorize_name}.zip"
}

resource "aws_lambda_function" "authorize" {
  filename         = local.authorize_zip
  function_name    = "module-repository-github-oidc-${local.authorize_name}-${var.region}-${var.environment_type}"
  handler          = local.authorize_handler
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = filebase64sha256(local.authorize_zip)
  runtime          = "nodejs18.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = local.env_vars
  }

  tags = var.default_tags
}

resource "aws_apigatewayv2_integration" "authorize" {
  api_id                 = aws_apigatewayv2_api.oidc_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.authorize.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "authorize" {
  api_id             = aws_apigatewayv2_api.oidc_api.id
  route_key          = "GET /authorize"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.authorize.id}"
}

resource "aws_lambda_permission" "authorize" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorize.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.oidc_api.execution_arn}/*"
}