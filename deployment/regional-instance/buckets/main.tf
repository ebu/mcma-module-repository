terraform {
  required_version = ">= 1.3.2"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.34"
    }
  }
}

locals {
  module_bucket_name         = "module-repository-modules-${var.region}-${var.environment_type}"
  module_staging_bucket_name = "module-repository-modules-staging-${var.region}-${var.environment_type}"
  replication_bucket_name    = "module-repository-modules-${var.replication_region}-${var.environment_type}"
}

resource "aws_s3_bucket" "modules_staging_bucket" {
  bucket        = local.module_staging_bucket_name
  tags          = var.default_tags
  force_destroy = true
}

resource "aws_s3_bucket_versioning" "modules_staging_bucket" {
  bucket = aws_s3_bucket.modules_staging_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

data "aws_iam_policy_document" "s3_assume_role_policy_doc" {
  statement {
    effect  = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = [
        "s3.amazonaws.com"
      ]
    }
  }
}

resource "aws_s3_bucket" "modules_bucket" {
  bucket        = local.module_bucket_name
  tags          = var.default_tags
  force_destroy = true
}

resource "aws_s3_bucket_acl" "modules_bucket_acl" {
  bucket = aws_s3_bucket.modules_bucket.id
  acl    = "private"
}

resource "aws_s3_bucket_versioning" "modules_bucket_versioning" {
  bucket = aws_s3_bucket.modules_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_iam_role" "replication_role" {
  name               = "${var.region}-to-${var.replication_region}-replication-${var.environment_type}"
  assume_role_policy = data.aws_iam_policy_document.s3_assume_role_policy_doc.json
}

data "aws_iam_policy_document" "replication_policy_doc" {
  statement {
    effect    = "Allow"
    actions   = ["s3:GetReplicationConfiguration", "s3:ListBucket"]
    resources = ["arn:aws:s3:::${local.module_bucket_name}"]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:GetObjectVersionForReplication", "s3:GetObjectVersionAcl", "s3:GetObjectVersionTagging"]
    resources = ["arn:aws:s3:::${local.module_bucket_name}/*"]
  }
  statement {
    effect    = "Allow"
    actions   = ["s3:ReplicateObject", "s3:ReplicateDelete", "s3:ReplicateTags"]
    resources = ["arn:aws:s3:::${local.replication_bucket_name}/*"]
  }
}

resource "aws_iam_policy" "replication_policy" {
  name   = "${var.region}-to-${var.replication_region}-replication-${var.environment_type}"
  policy = data.aws_iam_policy_document.replication_policy_doc.json
}

resource "aws_iam_role_policy_attachment" "replication_policy_attachment" {
  role       = aws_iam_role.replication_role.name
  policy_arn = aws_iam_policy.replication_policy.arn
}

resource "aws_s3_bucket_replication_configuration" "modules_bucket_replication" {
  depends_on = [aws_s3_bucket_versioning.modules_bucket_versioning]
  bucket = aws_s3_bucket.modules_bucket.id
  role = aws_iam_role.replication_role.arn

  rule {
    status = "Enabled"
    destination {
      bucket = "arn:aws:s3:::${local.replication_bucket_name}"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "modules_bucket_public_access" {
  bucket             = aws_s3_bucket.modules_bucket.id
  block_public_acls  = false
  ignore_public_acls = false
}