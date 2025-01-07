
const mergePluginConfig = (userConfig) => {
  return [
    {
      name: "endpoint",
      type: "input",
      default: userConfig.endpoint,
      required: true,
      alias: "访问目标地址",
    },
    {
      name: "accessKeyID",
      type: "input",
      default: userConfig.accessKeyID,
      required: true,
      message: "access key id",
      alias: "访问密钥 ID",
    },
    {
      name: "secretAccessKey",
      type: "password",
      default: userConfig.secretAccessKey,
      required: true,
      message: "secret access key",
      alias: "访问密钥",
    },
    {
      name: "bucketName",
      type: "input",
      default: userConfig.bucketName,
      required: true,
      alias: "存储桶名称",
    },
    {
      name: "customDomain",
      type: "input",
      default: userConfig.customDomain,
      required: true,
      alias: "自定义域名",
    },
    {
      name: "subFolder",
      type: "input",
      default: userConfig.subFolder,
      required: false,
      alias: "存储目录",
    },
    {
      name: "renameFile",
      type: "confirm",
      default: userConfig.renameFile,
      required: false,
      confirmText: '是',
      cancelText: '否',
      alias: "重命名文件(MD5)",
    },

  ]
}


export const getPluginConfig = (ctx) => {
  const defaultConfig = {
    accessKeyID: '',
    secretAccessKey: '',
    region: 'auto',
    endpoint: 'https://xxxx.r2.cloudflarestorage.com',
    bucketName: '',
    customDomain: '',
    subFolder: '/',
    renameFile: false
  }

  let userConfig = ctx.getConfig('picBed.r2')
  userConfig = { ...defaultConfig, ...(userConfig || {}) }

  return mergePluginConfig(userConfig)
}

export function loadUserConfig(ctx) {
  const userConfig = ctx.getConfig("picBed.r2")
  if (!userConfig) {
    ctx.log.error("无法获取 R2 配置")

    ctx.emit('notification', {
      title: `配置错误`,
      body: `无法获取 R2 配置`
    })
  }

  return userConfig
}
