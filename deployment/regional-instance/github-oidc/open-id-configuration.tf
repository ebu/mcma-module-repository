locals {
  openid_config_name    = "open-id-configuration"
  openid_config_handler = "${local.openid_config_name}.handler"
  openid_config_zip     = "${local.function_dir}/${local.openid_config_name}.zip"
}

resource "aws_lambda_function" "openid_config" {
  filename         = local.openid_config_zip
  function_name    = "module-repository-github-oidc-open-id-config-${var.region}-${var.environment_type}"
  handler          = local.openid_config_handler
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = filebase64sha256(local.openid_config_zip)
  runtime          = "nodejs14.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = local.env_vars
  }

  tags = var.default_tags
}

resource "aws_apigatewayv2_integration" "openid_config" {
  api_id                 = aws_apigatewayv2_api.oidc_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.openid_config.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "openid_config" {
  api_id             = aws_apigatewayv2_api.oidc_api.id
  route_key          = "GET /.well-known/openid-configuration"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.openid_config.id}"
}

resource "aws_lambda_permission" "openid_config" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.openid_config.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.oidc_api.execution_arn}/*"
}