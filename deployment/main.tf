terraform {
  required_version = ">= 1.3.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.8.0"
    }
  }
}

locals {
  log_group = "module-repository"
  default_tags = {
    Application = "module-repository"
  }
}

provider "aws" {
  alias   = "global"
  profile = var.profile
}

provider "aws" {
  alias   = "us_east"
  profile = var.profile
  region  = "us-east-1"
}

provider "aws" {
  alias   = "eu_west"
  profile = var.profile
  region  = "eu-west-1"
}

data "aws_caller_identity" "current" {
  provider     = aws.global
}

data "aws_route53_zone" "primary" {
  provider     = aws.global
  name         = var.zone_name
  private_zone = false
}

data "aws_acm_certificate" "us_east_cert" {
  provider = aws.us_east
  domain   = var.parent_domain
}

data "aws_acm_certificate" "eu_west_cert" {
  provider = aws.eu_west
  domain   = var.parent_domain
}

module "us_east" {
  source = "./regional-instance"
  providers = {
    aws = aws.us_east
  }

  profile          = var.profile
  environment_type = var.environment_type
  parent_domain    = var.parent_domain
  subdomain        = var.subdomain
  cert_arn         = data.aws_acm_certificate.us_east_cert.arn
  auth_cert_arn    = data.aws_acm_certificate.us_east_cert.arn

  auth_subdomain        = var.auth_subdomain
  github_oidc_subdomain = var.github_oidc_subdomain
  github_client_id      = var.github_client_id
  github_client_secret  = var.github_client_secret

  account_id = data.aws_caller_identity.current.account_id
  zone_id    = data.aws_route53_zone.primary.id

  default_tags = local.default_tags
  log_group    = local.log_group

  region             = "us-east-1"
  replication_region = "eu-west-1"
}

module "eu_west" {
  source = "./regional-instance"
  providers = {
    aws = aws.eu_west
  }

  profile          = var.profile
  environment_type = var.environment_type
  parent_domain    = var.parent_domain
  subdomain        = var.subdomain
  cert_arn         = data.aws_acm_certificate.eu_west_cert.arn
  auth_cert_arn    = data.aws_acm_certificate.us_east_cert.arn

  auth_subdomain        = var.auth_subdomain
  github_oidc_subdomain = var.github_oidc_subdomain
  github_client_id      = var.github_client_id
  github_client_secret  = var.github_client_secret

  account_id = data.aws_caller_identity.current.account_id
  zone_id    = data.aws_route53_zone.primary.id

  default_tags = local.default_tags
  log_group    = local.log_group

  region             = "eu-west-1"
  replication_region = "us-east-1"
}