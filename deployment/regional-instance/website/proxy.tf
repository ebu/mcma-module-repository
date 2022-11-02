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

resource "aws_apigatewayv2_stage" "website_proxy" {
  depends_on = [
    aws_apigatewayv2_route.website_proxy
  ]
  api_id      = aws_apigatewayv2_api.website_proxy.id
  name        = var.environment_type
  auto_deploy = true

  tags = var.default_tags
}

resource "aws_apigatewayv2_api_mapping" "regional_domain_name_mapping" {
  api_id          = aws_apigatewayv2_api.website_proxy.id
  domain_name     = local.regional_domain_name
  stage           = aws_apigatewayv2_stage.website_proxy.id
  api_mapping_key = "(none)"
}

resource "aws_apigatewayv2_api_mapping" "global_domain_name_mapping" {
  api_id          = aws_apigatewayv2_api.website_proxy.id
  domain_name     = local.global_domain_name
  stage           = aws_apigatewayv2_stage.website_proxy.id
  api_mapping_key = "(none)"
}