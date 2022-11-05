locals {
  regional_proxy_domain_name = "${var.auth_subdomain}-${var.region}-${var.environment_type}-proxy.${var.parent_domain}"
  global_domain_name         = "${var.auth_subdomain}.${var.parent_domain}"
}

resource "aws_apigatewayv2_api" "auth_proxy" {
  name          = "mcma-module-repository-auth-redirect-${var.region}-${var.environment_type}"
  description   = "Provides redirection from a global endpoint to regional Cognito pool domains"
  protocol_type = "HTTP"
  tags          = var.default_tags
}

resource "aws_apigatewayv2_integration" "auth_proxy" {
  api_id             = aws_apigatewayv2_api.auth_proxy.id
  connection_type    = "INTERNET"
  integration_method = "ANY"
  integration_type   = "HTTP_PROXY"
  integration_uri    = "https://${aws_cognito_user_pool_domain.auth_domain.domain}/{proxy}"
}

resource "aws_apigatewayv2_route" "auth_proxy" {
  api_id    = aws_apigatewayv2_api.auth_proxy.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.auth_proxy.id}"
}

resource "aws_apigatewayv2_stage" "auth_proxy_stage" {
  depends_on  = [aws_apigatewayv2_route.auth_proxy]
  api_id      = aws_apigatewayv2_api.auth_proxy.id
  name        = var.environment_type
  auto_deploy = true

  tags = var.default_tags
}

resource "aws_apigatewayv2_api_mapping" "regional_proxy_domain_name_mapping" {
  api_id      = aws_apigatewayv2_api.auth_proxy.id
  domain_name = aws_apigatewayv2_domain_name.regional_proxy_domain_name.id
  stage       = aws_apigatewayv2_stage.auth_proxy_stage.id
}

resource "aws_apigatewayv2_api_mapping" "global_domain_name_mapping" {
  api_id      = aws_apigatewayv2_api.auth_proxy.id
  domain_name = aws_apigatewayv2_domain_name.global_domain_name.id
  stage       = aws_apigatewayv2_stage.auth_proxy_stage.id
}

resource "aws_apigatewayv2_domain_name" "regional_proxy_domain_name" {
  domain_name = local.regional_proxy_domain_name

  domain_name_configuration {
    certificate_arn = var.cert_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_apigatewayv2_domain_name" "global_domain_name" {
  domain_name = local.global_domain_name

  domain_name_configuration {
    certificate_arn = var.cert_arn
    endpoint_type   = "REGIONAL"
    security_policy = "TLS_1_2"
  }
}

resource "aws_route53_record" "regional_proxy" {
  name    = aws_apigatewayv2_domain_name.regional_proxy_domain_name.domain_name
  type    = "A"
  zone_id = var.zone_id

  alias {
    name                   = aws_apigatewayv2_domain_name.regional_proxy_domain_name.domain_name_configuration[0].target_domain_name
    zone_id                = aws_apigatewayv2_domain_name.regional_proxy_domain_name.domain_name_configuration[0].hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "global" {
  name           = local.global_domain_name
  zone_id        = var.zone_id
  set_identifier = "${var.region}-${var.environment_type}"
  type           = "CNAME"
  ttl            = "300"
  records        = [local.regional_proxy_domain_name]

  latency_routing_policy {
    region = var.region
  }
}