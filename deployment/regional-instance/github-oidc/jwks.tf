locals {
  jwks_name    = "jwks"
  jwks_handler = "${local.jwks_name}.handler"
  jwks_zip     = "${local.function_dir}/${local.jwks_name}.zip"
}

resource "aws_lambda_function" "jwks" {
  filename         = local.jwks_zip
  function_name    = "module-repository-github-oidc-${local.jwks_name}-${var.region}-${var.environment_type}"
  handler          = local.jwks_handler
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = filebase64sha256(local.jwks_zip)
  runtime          = "nodejs14.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = local.env_vars
  }

  tags = var.default_tags
}

resource "aws_apigatewayv2_integration" "jwks" {
  api_id                 = aws_apigatewayv2_api.oidc_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.jwks.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "jwks" {
  api_id             = aws_apigatewayv2_api.oidc_api.id
  route_key          = "GET /.well-known/jwks.json"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.jwks.id}"
}

resource "aws_lambda_permission" "jwks" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.jwks.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.oidc_api.execution_arn}/*"
}