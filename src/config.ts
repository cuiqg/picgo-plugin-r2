import { IPicGo, IPluginConfig } from 'picgo'

export interface IR2UserConfig {
  accessKeyID: string
  secretAccessKey: string
  region?: string
  bucketName: string
  endpoint: string
  customDomain: string
  subFolder?: string
}

const mergePluginConfig = (userConfig: IR2UserConfig): IPluginConfig[] => {
  return [
    {
      name: "endpoint",
      type: "input",
      default: userConfig.endpoint,
      required: true,
      alias: "自定义节点",
    },
    {
      name: "accessKeyID",
      type: "input",
      default: userConfig.accessKeyID,
      required: true,
      message: "access key id",
      alias: "应用密钥 ID",
    },
    {
      name: "secretAccessKey",
      type: "password",
      default: userConfig.secretAccessKey,
      required: true,
      message: "secret access key",
      alias: "应用密钥",
    },
    {
      name: "bucketName",
      type: "input",
      default: userConfig.bucketName,
      required: true,
      alias: "存储桶名称",
    },
    {
      name: "subFolder",
      type: "input",
      default: userConfig.subFolder,
      required: false,
      alias: "存储桶内的子目录，可以不填",
    },
    {
      name: "customDomain",
      type: "input",
      default: userConfig.customDomain,
      required: true,
      alias: "请输入访问文件的公开域名",
    },

  ]
}


export const getPluginConfig = (ctx: IPicGo): IPluginConfig[] => {
  const defaultConfig: IR2UserConfig = {
    accessKeyID: '',
    secretAccessKey: '',
    region: 'auto',
    endpoint: '',
    bucketName: '',
    customDomain: '',
    subFolder: '/'
  }

  let userConfig = ctx.getConfig<IR2UserConfig>('picBed.r2')
  userConfig = { ...defaultConfig, ...(userConfig || {}) }

  return mergePluginConfig(userConfig)
}

export function loadUserConfig(ctx: IPicGo): IR2UserConfig {
  const userConfig: IR2UserConfig = ctx.getConfig("picBed.r2")
  if (!userConfig) {
    ctx.log.error("无法获取 R2 配置")

    ctx.emit('notification', {
      title: `配置错误`,
      body: `无法获取 R2 配置`
    })
  }

  return userConfig
}
