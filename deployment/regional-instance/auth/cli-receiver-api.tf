resource "aws_apigatewayv2_api" "token_response_push" {
  name          = "mcma-module-repository-token-ws-${var.region}-${var.environment_type}"
  description   = "Websocket API for CLI to receive tokens"
  protocol_type = "WEBSOCKET"
  tags          = var.default_tags
}

resource "aws_apigatewayv2_integration" "token_response_push" {
  api_id                        = aws_apigatewayv2_api.token_response_push.id
  integration_type              = "MOCK"
  template_selection_expression = "\\$default"
}

resource "aws_apigatewayv2_route" "token_response_push" {
  api_id    = aws_apigatewayv2_api.token_response_push.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.token_response_push.id}"
}

resource "aws_apigatewayv2_integration_response" "token_response_push" {
  api_id                   = aws_apigatewayv2_api.token_response_push.id
  integration_id           = aws_apigatewayv2_integration.token_response_push.id
  integration_response_key = "$default"
  response_templates = {

  }
}