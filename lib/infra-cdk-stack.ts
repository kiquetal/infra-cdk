import * as cdk from '@aws-cdk/core';
import {IConstruct, SecretValue, Tag, Tags} from '@aws-cdk/core';
import * as iam from '@aws-cdk/aws-iam';
import * as ec2 from '@aws-cdk/aws-ec2';
import {
  AmazonLinuxImage,
  BastionHostLinux,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  Subnet,
  SubnetType
} from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import { Utils } from './utils';


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
        },
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name:'subnet-public',
          cidrMask:24
        }
      ]
    });


    const publicSecurityGroup = new ec2.SecurityGroup(this,'publicSecurityGroup',{
      vpc:vpc,
      securityGroupName:'public-security-group',
      allowAllOutbound:true,

    });

    Utils.addTagToResource('Name','Security group for bastion',publicSecurityGroup as IConstruct);

    const bastion = new BastionHostLinux(this,'bastion-id', {

          vpc: vpc,
          securityGroup: publicSecurityGroup,
          instanceName: 'instance-bastion',
          machineImage:new AmazonLinuxImage(),
          instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
          subnetSelection: vpc.selectSubnets({subnetGroupName:'subnet-public'})
        }
    );

    bastion.instance.instance.addPropertyOverride('KeyName', 'for-bastion');

    const roleForLambda = new iam.Role(this,'RoleForLambda',{
      managedPolicies:[
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
          iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSFullAccess')
      ],
      assumedBy:new iam.ServicePrincipal('lambda.amazonaws.com')

    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this,'rdsSecurityGroup',
        {
          vpc: vpc,
          securityGroupName:'rds-security-group',
        allowAllOutbound:false
        });
        //@ts-ignore
        Utils.addTagToResource('Name','Security group for rds',rdsSecurityGroup);

    const lambdaSecurityGroup = new ec2.SecurityGroup(this,'lambdaSecurityGroup',{
      vpc:vpc,
      securityGroupName:'lambda-security-group',
      allowAllOutbound:false
    });

    //@ts-ignore
    Utils.addTagToResource('Name','Security group for lambda',lambdaSecurityGroup);

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

    publicSecurityGroup.addIngressRule(Peer.anyIpv4(),Port.tcp(22),'Acceso al subnet publico');
    lambdaSecurityGroup.addEgressRule(rdsSecurityGroup,Port.tcp(3306),'Acceso al Rds');
    rdsSecurityGroup.addIngressRule(lambdaSecurityGroup,Port.tcp(3306),'Acceso del lambda');
    rdsSecurityGroup.addIngressRule(publicSecurityGroup,Port.tcp(3306),'Acceso al rds desde subnet publico');
    // @ts-ignore
    let allS = vpc.selectSubnets(ec2.SubnetType.ISOLATED).subnetIds;
    let m =Subnet.fromSubnetAttributes(this,'subnet',{
      subnetId:allS[0]
    })

    new cdk.CfnOutput(this, 'dbEndpoint', {
      value: dbInstance.instanceEndpoint.hostname,
    });



  }


}
