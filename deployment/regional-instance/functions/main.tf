data "aws_iam_policy_document" "lambda_assume_role_policy_doc" {
  statement {
    effect  = "Allow"
    actions = [
      "sts:AssumeRole"
    ]
    principals {
      type        = "Service"
      identifiers = [
        "lambda.amazonaws.com"
      ]
    }
  }
}

data "aws_iam_policy_document" "lambda_cloudwatch_access" {
  statement {
    effect    = "Allow"
    actions   = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:PutLogEvents"
    ]
    resources = [
      "*"
    ]
  }
}

resource "aws_iam_policy" "lambda_cloudwatch_access" {
  name   = "module-repository-${var.region}-lambda-cloudwatch-access"
  policy = data.aws_iam_policy_document.lambda_cloudwatch_access.json
}

data "aws_iam_policy_document" "worker_lambda_access_policy" {
  statement {
    effect    = "Allow"
    actions   = [
      "lambda:InvokeFunction"
    ]
    resources = [
      aws_lambda_function.worker.arn
    ]
  }
}

resource "aws_iam_policy" "worker_lambda_access" {
  name   = "module-repository-${var.region}-worker-lambda-access"
  policy = data.aws_iam_policy_document.worker_lambda_access_policy.json
}