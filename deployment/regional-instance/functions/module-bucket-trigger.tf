resource "aws_iam_role" "module_bucket_trigger_role" {
  name               = "module-repository-module-bucket-trigger-${var.region}-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role_policy_doc.json
}

data "aws_iam_policy_document" "module_bucket_trigger_s3_access_policy" {
  statement {
    effect    = "Allow"
    actions   = [
      "s3:ListBucket"
    ]
    resources = [
      "arn:aws:s3:::${var.module_bucket.id}"
    ]
  }
  statement {
    effect    = "Allow"
    actions   = [
      "s3:GetObject"
    ]
    resources = [
      "arn:aws:s3:::${var.module_bucket.id}/*"
    ]
  }
}

resource "aws_iam_policy" "module_bucket_trigger_s3_policy" {
  name   = "module-repository-module-bucket-trigger-${var.region}-s3-access"
  policy = data.aws_iam_policy_document.module_bucket_trigger_s3_access_policy.json
}

resource "aws_iam_role_policy_attachment" "module_bucket_trigger_s3_policy_attachment" {
  role       = aws_iam_role.module_bucket_trigger_role.name
  policy_arn = aws_iam_policy.module_bucket_trigger_s3_policy.arn
}

resource "aws_iam_role_policy_attachment" "module_bucket_trigger_cloudwatch_policy_attachment" {
  role       = aws_iam_role.module_bucket_trigger_role.name
  policy_arn = aws_iam_policy.lambda_cloudwatch_access.arn
}

resource "aws_iam_role_policy_attachment" "module_bucket_trigger_lambda_policy_attachment" {
  role       = aws_iam_role.module_bucket_trigger_role.name
  policy_arn = aws_iam_policy.worker_lambda_access.arn
}

resource "aws_lambda_function" "module_bucket_trigger" {
  filename         = "../service/module-bucket-trigger/build/dist/lambda.zip"
  function_name    = "module-repository-module-bucket-trigger-${var.region}"
  role             = aws_iam_role.module_bucket_trigger_role.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../service/module-bucket-trigger/build/dist/lambda.zip")
  runtime          = "nodejs12.x"
  timeout          = "30"
  memory_size      = "3008"

  environment {
    variables = {
      LogGroupName     = var.log_group
      WorkerFunctionId = aws_lambda_function.worker.function_name
    }
  }

  tags = var.default_tags
}

resource "aws_lambda_permission" "allow_module_bucket_notification" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.module_bucket_trigger.arn
  principal     = "s3.amazonaws.com"
  source_arn    = var.module_bucket.arn
}

resource "aws_s3_bucket_notification" "module_bucket_object_created" {
  bucket = var.module_bucket.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.module_bucket_trigger.arn
    events              = ["s3:ObjectCreated:*"]
    filter_suffix       = ".zip"
  }

  depends_on = [
    aws_lambda_permission.allow_module_bucket_notification
  ]
}