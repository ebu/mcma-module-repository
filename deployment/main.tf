terraform {
  required_version = ">= 0.13"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.26"
    }
  }
}

locals {
  log_group    = "module-repository"
  default_tags = {
    Application = "module-repository"
  }
}

provider "aws" {
  profile = var.profile
  region  = "us-east-1"
}

data "aws_caller_identity" "current" {}

module "us_east" {
  source = "./regional-instance"

  profile      = var.profile
  account_id   = data.aws_caller_identity.current.account_id
  default_tags = local.default_tags
  log_group    = local.log_group

  region             = "us-east-1"
  replication_region = "eu-west-1"
}

provider "aws" {
  profile = var.profile
  region  = "eu-west-1"
  alias   = "eu_west"
}

module "eu_west" {
  source = "./regional-instance"

  profile      = var.profile
  account_id   = data.aws_caller_identity.current.account_id
  default_tags = local.default_tags
  log_group    = local.log_group

  region             = "eu-west-1"
  replication_region = "us-east-1"
}