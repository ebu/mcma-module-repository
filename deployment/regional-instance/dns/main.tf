locals {
  regional_domain_name = "${var.subdomain}-${var.region}-${var.environment_type}.${var.parent_domain}"
  global_domain_name   = "${var.subdomain}.${var.parent_domain}"
}

resource "aws_api_gateway_domain_name" "regional_domain_name" {
  domain_name              = local.regional_domain_name
  regional_certificate_arn = var.cert_arn
  security_policy          = "TLS_1_2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_domain_name" "global_domain_name" {
  domain_name              = local.global_domain_name
  regional_certificate_arn = var.cert_arn
  security_policy          = "TLS_1_2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_route53_record" "dns_record" {
  name    = aws_api_gateway_domain_name.regional_domain_name.domain_name
  type    = "A"
  zone_id = var.zone_id

  alias {
    name                   = aws_api_gateway_domain_name.regional_domain_name.regional_domain_name
    zone_id                = aws_api_gateway_domain_name.regional_domain_name.regional_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "modules" {
  name           = local.global_domain_name
  zone_id        = var.zone_id
  set_identifier = "${var.region}-${var.environment_type}"
  type           = "CNAME"
  ttl            = "300"
  records        = [local.regional_domain_name]

  latency_routing_policy {
    region = var.region
  }
}