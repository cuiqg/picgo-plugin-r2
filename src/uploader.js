import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { extractInfo, generatorURL, formatPath } from './utils'

const createS3Client = (config) => {
  const clientConfig = {
    region: config.region || 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyID,
      secretAccessKey: config.secretAccessKey
    }
  }

  return new S3Client(clientConfig)
}

const createUploadTask = async (config) => {
  const key = formatPath(config.userConfig, config.item)
  const bucketName = config.userConfig.bucketName
  const ctx = config.ctx

  const result = {
    index: config.index,
    key
  }

  if (!config.item.buffer && !config.item.base64Image) {
    result.error = new Error(`"${config.item.fileName}" No image data provided: buffer or base64Image is required`)
    return result
  }

  let body
  let contentType

  try {
    ({ body, contentType } = await extractInfo(config.item))
  }
  catch (err) {
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
  }
  catch (err) {
    result.error = new Error(
      `上传 "${config.item.fileName}" 失败: ${err instanceof Error ? err.message : String(err)}`
    )
  }
  return result
}

/**
 * @param {Object} config
 * @param {PicGo} config.ctx
 * @param {Object} config.userConfig
 * @param {Object} config.item
 * @param {number} config.index
 * @param {S3Client} config.client
 */
const createRemoveTask = async (config) => {
  const ctx = config.ctx
  const file = config.item
  const bucketName = config.userConfig.bucketName

  const { imgUrl } = file

  const url = new URL(imgUrl)
  let pathname = url.pathname

  if (pathname.startsWith('/')) {
    pathname = pathname.slice(1)
  }

  let result = {
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
    ctx.log.success(`删除 "${pathname}" 成功`)
  }
  catch (err) {
    result.error = new Error(
      `删除 "${pathname}" 失败: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  return result
}

export default {
  createS3Client,
  createUploadTask,
  createRemoveTask
}
