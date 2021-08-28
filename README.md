### Simple vpc with subnet for lambda and rds

#### The stack to be created resides in

[Infra-cdk.ts](./bin/infra-cdk.ts)


#### Prerequisites

##### 
   
    A valid profile to be use with the following command in the root folder of the projects


#### You need to create some ssm entry if you're referencing those values in your stack.


[ExampleInUse](https://github.com/kiquetal/infra-cdk/blob/620fdd7cb32c68286b58949f91edf0592f378017/lib/rds-stack.ts#L38)

##### Usefull commands

- cdk deploy --profile <aws_profile>

##### Destroy

- cdk destroy --profile <aws_profile>

##### Output clouformation file

- cdk synthesize
