import * as cdk from '@aws-cdk/core';
import {SecretValue, Tags} from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';

import {Port, Subnet, SubnetFilter, SubnetType, Vpc} from '@aws-cdk/aws-ec2';

export class InfraCdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this,'vpc-for-tigosports',{
      cidr:'10.0.0.0/16',
      maxAzs:2,
      subnetConfiguration:[
        {
          subnetType: ec2.SubnetType.ISOLATED,
          name: 'subnet-1',
          cidrMask:24
        }
      ]
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this,'rdsSecurityGroup',
        {
          vpc: vpc,
          securityGroupName:'rds-security-group',
        allowAllOutbound:false
        });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this,'lambdaSecurityGroup',{
      vpc:vpc,
      securityGroupName:'lambda-security-group',
      allowAllOutbound:false
    });



    const dbInstance = new rds.DatabaseInstance(this,'db-tigosports',{
      vpc:vpc,
      vpcSubnets:{
        subnetType:ec2.SubnetType.ISOLATED
      },
      instanceIdentifier:'dbsports',
      engine:rds.DatabaseInstanceEngine.mysql({
        version:rds.MysqlEngineVersion.VER_5_7
      }),
      instanceType:ec2.InstanceType.of(
          ec2.InstanceClass.BURSTABLE3,
          ec2.InstanceSize.MICRO
      ),
      //@ts-ignore
      credentials:rds.Credentials.fromPassword('dbuser',SecretValue.ssmSecure('/db/password',1)),
      databaseName:'dbtest',
      multiAz:true,
      storageEncrypted:true,
      securityGroups:[rdsSecurityGroup],

    });

    lambdaSecurityGroup.addEgressRule(rdsSecurityGroup,Port.tcp(3306),'Acceso al Rds');
    rdsSecurityGroup.addIngressRule(lambdaSecurityGroup,Port.tcp(3306),'Acceso del lambda');
    // @ts-ignore
    let allS = vpc.selectSubnets(ec2.SubnetType.ISOLATED).subnetIds;
    console.log(allS);
    let m =Subnet.fromSubnetAttributes(this,'subnet',{
      subnetId:allS[0]
    })
    console.log(m.subnetId);

    new cdk.CfnOutput(this, 'dbEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
    });

    // @ts-ignore
    Tags.of(vpc).add("creator","enrique.melgarejo@edge.com.py");


  }


}
