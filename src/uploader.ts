import { S3Client, S3ClientConfig, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { IImgInfo, IPicGo } from 'picgo'
import { IR2UserConfig } from './config'
import { extractInfo, generatorURL, formatPath } from './utils'


export interface IUploadResult {
  index: number,
  key: string,
  url?: string
  versionId?: string
  eTag?: string
  error?: Error
}

export interface IRemoveResult {
  index: number
  key: string
  versionId?: string
  error?: Error
}


const createS3Client = (config: IR2UserConfig) => {
  const clientConfig: S3ClientConfig = {
    region: config.region || 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyID,
      secretAccessKey: config.secretAccessKey
    }
  }

  return new S3Client(clientConfig)
}


interface taskConfig {
  ctx: IPicGo
  client: S3Client
  userConfig: IR2UserConfig
  item: IImgInfo
  index: number
}

const createUploadTask = async (config: taskConfig): Promise<IUploadResult> => {
  const key = formatPath(config.userConfig, config.item)
  const bucketName = config.userConfig.bucketName
  const ctx = config.ctx

  const result: IUploadResult = {
    index: config.index,
    key
  }

  if (!config.item.buffer && !config.item.base64Image) {
    result.error = new Error(`"${config.item.fileName}" No image data provided: buffer or base64Image is required`)
    return result
  }

  let body: Buffer
  let contentType: string

  try {
    ({ body, contentType } = await extractInfo(config.item))
  } catch (err) {
    result.error = new Error(`Failed to extract ${config.item.fileName} image info: ${err instanceof Error ? err.message : String(err)}`)
    return result
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType
  })

  try {
    const output = await config.client.send(command)
    result.url = generatorURL(config.userConfig, config.item)
    result.versionId = output.VersionId
    result.eTag = output.ETag
    ctx.log.success(`上传 "${config.item.fileName}" 成功: ${result.url}`)
  } catch (err) {
    result.error = new Error(
      `上传 "${config.item.fileName}" 失败: ${err instanceof Error ? err.message : String(err)}`
    )
  }
  return result
}


const createRemoveTask = async (config: taskConfig): Promise<IRemoveResult> => {
  const ctx = config.ctx
  const file = config.item
  const bucketName = config.userConfig.bucketName

  const { imgUrl } = file

  const url = new URL(imgUrl)
  let pathname = url.pathname

  if (pathname.startsWith('/')) {
    pathname = pathname.slice(1)
  }

  let result: IRemoveResult = {
    index: config.index,
    key: pathname
  }

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: pathname
  })

  try {
    const output = await config.client.send(command)
    result.versionId = output.VersionId
    ctx.log.success(`删除 "${config.item.fileName}" 成功`)
  } catch (err) {
    result.error = new Error(
      `删除 "${config.item.fileName}" 失败: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  return result
}


export default {
  createS3Client,
  createUploadTask,
  createRemoveTask
}
