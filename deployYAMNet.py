import sagemaker, boto3, json, uuid, os, time
from sagemaker.tensorflow.model import TensorFlowModel
from sagemaker.serializers import BytesSerializer
from sagemaker.deserializers import JSONDeserializer

sess  = sagemaker.Session()
role  = sagemaker.get_execution_role()          # if you’re in SageMaker Studio / Notebook
# role = "arn:aws:iam::<ACCOUNT>:role/<SageMakerExecutionRole>"  # otherwise hard-code

model_artifact = "s3://llama4hackathon/yamnet/model.tar.gz"
endpoint_name  = f"yamnet-{uuid.uuid4().hex[:8]}"

yamnet_model = TensorFlowModel(
    model_data        = model_artifact,
    role              = role,
    framework_version = "2.14",         # matches TF SavedModel
    sagemaker_session = sess,
    env = {
        # speeds up warm-up a bit
        "SAGEMAKER_TFS_DEFAULT_MODEL_NAME": "yamnet"
    },
)

predictor = yamnet_model.deploy(
    endpoint_name          = endpoint_name,
    instance_type          = "ml.g4dn.xlarge",   # GPU ⟶ ~200 ms / 0.25-s chunk
    initial_instance_count = 1,
    serializer   = BytesSerializer(),            # we’ll send raw PCM bytes
    deserializer = JSONDeserializer()
)

print("🎉  Deployed at:", endpoint_name)
