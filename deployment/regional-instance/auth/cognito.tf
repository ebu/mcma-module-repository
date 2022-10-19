locals {
  regional_domain_name = "${var.auth_subdomain}-${var.region}-${var.environment_type}.${var.parent_domain}"
  global_domain_name   = "${var.auth_subdomain}.${var.parent_domain}"
  github_oidc_root     = "https://${var.github_oidc_subdomain}.${var.parent_domain}"
}

resource "aws_cognito_user_pool" "users" {
  name = "mcma-module-repository-users"
  tags = var.default_tags
}

resource "aws_cognito_user_pool_domain" "auth_domain" {
  domain          = local.regional_domain_name
  certificate_arn = var.cert_arn
  user_pool_id    = aws_cognito_user_pool.users.id
}

resource "aws_route53_record" "auth_domain_dns" {
  name    = aws_cognito_user_pool_domain.auth_domain.domain
  type    = "A"
  zone_id = var.zone_id

  alias {
    evaluate_target_health = false
    name                   = aws_cognito_user_pool_domain.auth_domain.cloudfront_distribution_arn
    # This zone_id is fixed
    zone_id = "Z2FDTNDATAQYW2"
  }
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "mcma-module-repository"
  user_pool_id = aws_cognito_user_pool.users.id
}

resource "aws_cognito_identity_provider" "github_oidc_provider" {
  user_pool_id  = aws_cognito_user_pool.users.id
  provider_name = "GitHub"
  provider_type = "OIDC"

  provider_details = {
    attributes_request_method = "GET"
    authorize_scopes          = "openid read:user user:email"
    client_id                 = var.github_client_id
    client_secret             = var.github_client_secret
    oidc_issuer               = local.github_oidc_root

#    authorization_endpoint = "${local.github_oidc_root}/authorize"
#    token_endpoint         = "${local.github_oidc_root}/token"
#    userinfo_endpoint      = "${local.github_oidc_root}/userinfo"
#    jwks_uri               = "${local.github_oidc_root}/.well-known/jwks.json"
  }

  attribute_mapping = {
    username           = "sub"
    email              = "email"
    email_verified     = "email_verified"
    name               = "name"
    picture            = "picture"
    preferred_username = "preferred_username"
    profile            = "profile"
    updated_at         = "updated_at"
    website            = "website"
  }
}

resource "aws_route53_record" "global_domain" {
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