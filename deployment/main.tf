locals {
  service_url         = "https://${aws_api_gateway_rest_api.service_api.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}"
  service_bucket_name = var.project_prefix
}

#########################
# Provider registration
#########################

provider "aws" {
  version = "~> 2.25"

  access_key = var.aws_access_key
  secret_key = var.aws_secret_key
  region     = var.aws_region
}

##################################
# AWs Policies
##################################

resource "aws_iam_policy" "log_policy" {
  name        = "${var.project_prefix}.policy-log"
  description = "Policy to write to log"
  policy      = file("policies/allow-full-logs.json")
}

resource "aws_iam_policy" "dynamodb_policy" {
  name        = "${var.project_prefix}.policy-dynamodb"
  description = "Policy to Access DynamoDB"
  policy      = file("policies/allow-full-dynamodb.json")
}

##################################
# aws_iam_role : iam_for_exec_lambda
##################################

resource "aws_iam_role" "service" {
  name               = format("%.64s", "${var.project_prefix}.service")
  assume_role_policy = file("policies/lambda-allow-assume-role.json")
}

resource "aws_iam_role_policy_attachment" "service_policy_log" {
  role       = aws_iam_role.service.name
  policy_arn = aws_iam_policy.log_policy.arn
}

resource "aws_iam_role_policy_attachment" "service_policy_dynamodb" {
  role       = aws_iam_role.service.name
  policy_arn = aws_iam_policy.dynamodb_policy.arn
}

##################################
# aws_dynamodb_table : service_table
##################################

resource "aws_s3_bucket" "repository" {
  bucket        = local.service_bucket_name
  acl           = "private"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "repository" {
  bucket = aws_s3_bucket.repository.id

  block_public_acls = true
  block_public_policy = true
  ignore_public_acls = true
  restrict_public_buckets = true
}

##################################
# aws_dynamodb_table : service_table
##################################

resource "aws_dynamodb_table" "service_table" {
  name         = "${var.project_prefix}-service"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "resource_type"
  range_key    = "resource_id"

  attribute {
    name = "resource_type"
    type = "S"
  }

  attribute {
    name = "resource_id"
    type = "S"
  }

  stream_enabled   = true
  stream_view_type = "NEW_IMAGE"
}

#################################
#  aws_lambda_function : service-api-handler
#################################

resource "aws_lambda_function" "service_api_handler" {
  filename         = "../service/api-handler/build/dist/lambda.zip"
  function_name    = format("%.64s", replace("${var.project_prefix}-service-api-handler", "/[^a-zA-Z0-9_]+/", "-" ))
  role             = aws_iam_role.service.arn
  handler          = "index.handler"
  source_code_hash = filebase64sha256("../service/api-handler/build/dist/lambda.zip")
  runtime          = "nodejs10.x"
  timeout          = "900"
  memory_size      = "3008"

  environment {
    variables = {
      TableName = aws_dynamodb_table.service_table.name
      PublicUrl = local.service_url
    }
  }
}

##############################
#  aws_api_gateway_rest_api:  service_api
##############################
resource "aws_api_gateway_rest_api" "service_api" {
  name        = "${var.project_prefix}-service-api"
  description = "Launch Control Service Rest Api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "service_api_resource" {
  rest_api_id = aws_api_gateway_rest_api.service_api.id
  parent_id   = aws_api_gateway_rest_api.service_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "service_options_method" {
  rest_api_id   = aws_api_gateway_rest_api.service_api.id
  resource_id   = aws_api_gateway_resource.service_api_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "service_options_200" {
  rest_api_id = aws_api_gateway_rest_api.service_api.id
  resource_id = aws_api_gateway_resource.service_api_resource.id
  http_method = aws_api_gateway_method.service_options_method.http_method
  status_code = "200"

  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration" "service_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.service_api.id
  resource_id = aws_api_gateway_resource.service_api_resource.id
  http_method = aws_api_gateway_method.service_options_method.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{ \"statusCode\": 200 }"
  }
}

resource "aws_api_gateway_integration_response" "service_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.service_api.id
  resource_id = aws_api_gateway_resource.service_api_resource.id
  http_method = aws_api_gateway_method.service_options_method.http_method
  status_code = aws_api_gateway_method_response.service_options_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,PATCH,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  response_templates = {
    "application/json" = ""
  }
}

resource "aws_api_gateway_method" "service_api_method" {
  rest_api_id   = aws_api_gateway_rest_api.service_api.id
  resource_id   = aws_api_gateway_resource.service_api_resource.id
  http_method   = "ANY"
  authorization = "NONE"
  //"AWS_IAM"
}

resource "aws_api_gateway_integration" "service_api_method_integration" {
  rest_api_id             = aws_api_gateway_rest_api.service_api.id
  resource_id             = aws_api_gateway_resource.service_api_resource.id
  http_method             = aws_api_gateway_method.service_api_method.http_method
  type                    = "AWS_PROXY"
  uri                     = "arn:aws:apigateway:${var.aws_region}:lambda:path/2015-03-31/functions/arn:aws:lambda:${var.aws_region}:${var.aws_account_id}:function:${aws_lambda_function.service_api_handler.function_name}/invocations"
  integration_http_method = "POST"
}

resource "aws_lambda_permission" "apigw_service_api_handler" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.service_api_handler.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:${var.aws_region}:${var.aws_account_id}:${aws_api_gateway_rest_api.service_api.id}/*/${aws_api_gateway_method.service_api_method.http_method}/*"
}

resource "aws_api_gateway_deployment" "service_deployment" {
  depends_on = [
    aws_api_gateway_integration.service_options_integration,
    aws_api_gateway_integration.service_api_method_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.service_api.id
  stage_name  = var.stage_name
}
