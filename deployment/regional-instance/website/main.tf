locals {
  website_bucket_name = "mcma-module-repository-website-${var.region}-${var.environment_type}"
  website_dist_dir    = "../website/dist/website"
  website_dist_files  = fileset(local.website_dist_dir, "**")
  website_config      = jsonencode({
    region       = var.region
    environment  = var.environment_type
    clientId     = var.client_id
    authCallback = "https://${local.global_domain_name}/auth-callback"
  })
}

resource "aws_s3_bucket" "website" {
  bucket        = local.website_bucket_name
  force_destroy = true
}

resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id
  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = "*"
        Action    = [
          "s3:GetObject"
        ]
        Resource = [
          "arn:aws:s3:::${local.website_bucket_name}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

resource "aws_s3_object" "website_file" {
  for_each = local.website_dist_files
  bucket   = aws_s3_bucket.website.id
  key      = each.value
  source   = "${local.website_dist_dir}/${each.value}"
  etag     = filemd5("${local.website_dist_dir}/${each.value}")

  content_type = (
  endswith(each.value, "jpg") ? "image/jpeg" :
  endswith(each.value, "png") ? "image/png" :
  endswith(each.value, "html") ? "text/html" :
  endswith(each.value, "js") ? "text/javascript" :
  endswith(each.value, "css") ? "text/css" : "text/plain"
  )
}

resource "aws_s3_object" "website_config_file" {
  bucket       = aws_s3_bucket.website.id
  key          = "config.json"
  etag         = md5(local.website_config)
  content      = local.website_config
  content_type = "application/json"
}