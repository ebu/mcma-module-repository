locals {
  userinfo_name    = "userinfo"
  userinfo_handler = "${local.userinfo_name}.handler"
  userinfo_zip     = "${local.function_dir}/${local.userinfo_name}.zip"
}

resource "aws_lambda_function" "userinfo" {
  filename         = local.userinfo_zip
  function_name    = "module-repository-github-oidc-${local.userinfo_name}-${var.region}-${var.environment_type}"
  handler          = local.userinfo_handler
  role             = aws_iam_role.lambda_role.arn
  source_code_hash = filebase64sha256(local.userinfo_zip)
  runtime          = "nodejs14.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = local.env_vars
  }

  tags = var.default_tags
}

resource "aws_apigatewayv2_integration" "userinfo" {
  api_id                 = aws_apigatewayv2_api.oidc_api.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.userinfo.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "userinfo_get" {
  api_id             = aws_apigatewayv2_api.oidc_api.id
  route_key          = "GET /userinfo"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.userinfo.id}"
}

resource "aws_apigatewayv2_route" "userinfo_post" {
  api_id             = aws_apigatewayv2_api.oidc_api.id
  route_key          = "POST /userinfo"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.userinfo.id}"
}

resource "aws_lambda_permission" "userinfo" {
  statement_id  = "AllowExecutionFromAPIGatewayDefault"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.userinfo.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.oidc_api.execution_arn}/*"
}