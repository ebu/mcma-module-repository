locals {
  regional_ws_domain_name = "${var.auth_subdomain}-${var.region}-${var.environment_type}-ws.${var.parent_domain}"
  global_ws_domain_name   = "${var.auth_subdomain}-ws.${var.parent_domain}"
}

resource "aws_apigatewayv2_api" "auth_ws" {
  name                       = "mcma-module-repository-auth-ws-${var.region}-${var.environment_type}"
  description                = "Websocket API for CLI to receive tokens"
  protocol_type              = "WEBSOCKET"
  route_selection_expression = "$request.body.action"
  tags                       = var.default_tags
}

resource "aws_apigatewayv2_integration" "get_connection_id" {
  api_id                        = aws_apigatewayv2_api.auth_ws.id
  integration_type              = "MOCK"
  template_selection_expression = "\\$default"

  request_templates = {
    "$default" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_apigatewayv2_integration_response" "get_connection_id" {
  api_id                        = aws_apigatewayv2_api.auth_ws.id
  integration_id                = aws_apigatewayv2_integration.get_connection_id.id
  integration_response_key      = "/200/"
  template_selection_expression = "\\$default"

  response_templates = {
    "$default" : "{ \"connectionId\": \"$context.connectionId\" }"
  }
}

resource "aws_apigatewayv2_route" "get_connection_id" {
  api_id             = aws_apigatewayv2_api.auth_ws.id
  route_key          = "GetConnectionId"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.get_connection_id.id}"
}

resource "aws_apigatewayv2_route_response" "get_connection_id" {
  api_id             = aws_apigatewayv2_api.auth_ws.id
  route_id           = aws_apigatewayv2_route.get_connection_id.id
  route_response_key = "$default"
}

resource "aws_apigatewayv2_stage" "auth_ws" {
  depends_on = [
    aws_apigatewayv2_route.get_connection_id
  ]
  api_id      = aws_apigatewayv2_api.auth_ws.id
  name        = var.environment_type
  auto_deploy = true

  tags = var.default_tags
}

resource "aws_apigatewayv2_api_mapping" "auth_ws_regional" {
  api_id      = aws_apigatewayv2_api.auth_ws.id
  domain_name = aws_apigatewayv2_domain_name.regional_ws_domain_name.id
  stage       = aws_apigatewayv2_stage.auth_ws.id
}

resource "aws_apigatewayv2_api_mapping" "auth_ws_global" {
  api_id      = aws_apigatewayv2_api.auth_ws.id
  domain_name = aws_apigatewayv2_domain_name.global_ws_domain_name.id
  stage       = aws_apigatewayv2_stage.auth_ws.id
}

resource "aws_apigatewayv2_domain_name" "regional_ws_domain_name" {
  domain_name = local.regional_ws_domain_name

  domain_name_configuration {
    certificate_arn = var.cert_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_domain_name" "global_ws_domain_name" {
  domain_name = local.global_ws_domain_name

  domain_name_configuration {
    certificate_arn = var.cert_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_route53_record" "regional_ws" {
  name    = aws_apigatewayv2_domain_name.regional_ws_domain_name.domain_name
  type    = "A"
  zone_id = var.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.regional_ws_domain_name.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.regional_ws_domain_name.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "global_ws" {
  name           = local.global_ws_domain_name
  zone_id        = var.zone_id
  set_identifier = "${var.region}-${var.environment_type}"
  type           = "CNAME"
  ttl            = "300"
  records        = [local.regional_ws_domain_name]

  latency_routing_policy {
    region = var.region
  }
}