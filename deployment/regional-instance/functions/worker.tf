resource "aws_iam_role" "worker_role" {
  name               = "module-repository-worker-${var.region}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy_doc.json
}

data "aws_iam_policy_document" "worker_s3_access_policy" {
  statement {
    effect    = "Allow"
    actions   = [
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.module_staging_bucket.id}",
      "arn:aws:s3:::${var.module_bucket.id}"
    ]
  }
  statement {
    effect    = "Allow"
    actions   = [
      "s3:GetObject",
      "s3:DeleteObject"
    ]
    resources = [
      "arn:aws:s3:::${var.module_staging_bucket.id}/*"
    ]
  }
  statement {
    effect    = "Allow"
    actions   = [
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = [
      "arn:aws:s3:::${var.module_bucket.id}/*"
    ]
  }
}

resource "aws_iam_policy" "worker_s3_policy" {
  name   = "module-repository-worker-${var.region}-s3-access"
  policy = data.aws_iam_policy_document.worker_s3_access_policy.json
}

resource "aws_iam_role_policy_attachment" "worker_s3_policy_attachment" {
  role       = aws_iam_role.worker_role.name
  policy_arn = aws_iam_policy.worker_s3_policy.arn
}

data "aws_iam_policy_document" "worker_es_policy" {
  statement {
    effect    = "Allow"
    actions   = [
      "es:ESHttpPut"
    ]
    resources = [
      "${var.elastic_domain_arn}/*"
    ]
  }
}

resource "aws_iam_policy" "worker_es_policy" {
  name = "module-repository-worker-${var.region}-es-access"
  policy = data.aws_iam_policy_document.worker_es_policy.json
}

resource "aws_iam_role_policy_attachment" "worker_es_policy_attachment" {
  role       = aws_iam_role.worker_role.name
  policy_arn = aws_iam_policy.worker_es_policy.arn
}

resource "aws_iam_role_policy_attachment" "worker_cloudwatch_policy_attachment" {
  role       = aws_iam_role.worker_role.name
  policy_arn = aws_iam_policy.lambda_cloudwatch_access.arn
}

resource "aws_lambda_function" "worker" {
  filename         = "../service/worker/build/dist/lambda.zip"
  function_name    = "module-repository-worker-${var.region}"
  role             = aws_iam_role.worker_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../service/worker/build/dist/lambda.zip")
  runtime          = "nodejs12.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = {
      LogGroupName        = var.log_group
      ModuleStagingBucket = var.module_staging_bucket.id
      ModuleBucket        = var.module_bucket.id
      ElasticEndpoint     = var.elastic_endpoint
      ElasticIndex        = var.elastic_index
      ElasticAuthType     = "AWS4"
      ElasticAuthContext  = "{ \"serviceName\": \"es\" }"
    }
  }

  tags = var.default_tags
}