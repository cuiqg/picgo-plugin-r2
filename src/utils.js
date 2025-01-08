import crypto from 'node:crypto'
import mime from 'mime'

export const formatPath = (userConfig, item) => {
  const { fileName, extname, buffer } = item
  const { subFolder, renameFile } = userConfig

  const pathPrefix = subFolder?.replace(new RegExp("^\/"),'').toString()

  if (renameFile) {
    const fileMD5 = crypto.createHash("md5").update(buffer).digest("hex")
    return  `${pathPrefix}${fileMD5}${extname}`
  } else {
    return `${pathPrefix}${fileName}`
  }
}

export const generatorURL = (userConfig, item) => {
  const { customDomain } = userConfig
  const path = formatPath(userConfig, item)
  return `${customDomain}/${path}`
}

export const extractInfo = async (item) => {
  const result = {
    body: '',
    contentType: ''
  }

  if (item.base64Image) {
    const body = item.base64Image.replace(/^data:[/\w]+;base64,/, '')
    result.contentType = item.base64Image.match(
      /[^:]\w+\/[\w-+.]+(?=;|,)/
    )?.[0]
    result.body = Buffer.from(body, 'base64')
  }
  else {
    if (item.extname) {
      result.contentType = mime.getType(item.extname)
    }
    result.body = item.buffer
  }

  return result
}
