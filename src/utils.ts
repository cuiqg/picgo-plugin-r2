import { IImgInfo } from 'picgo'
import { IR2UserConfig } from './config'
import { posix } from 'path'
import mime from "mime"

export const formatPath = (userConfig: IR2UserConfig, item: IImgInfo) => {
  const { fileName } = item
  const { subFolder } = userConfig
  return posix.join(subFolder, fileName)
}

export const generatorURL = (userConfig: IR2UserConfig, item: IImgInfo) => {
  const { customDomain } = userConfig
  const path = formatPath(userConfig, item)
  return `${customDomain}/${path}`
}

export const extractInfo = async (item: IImgInfo): Promise<{
  body?: Buffer
  contentType?: string
}> => {
  const result: {
    body?: Buffer
    contentType?: string
  } = {}

  if (item.base64Image) {
    const body = item.base64Image.replace(/^data:[/\w]+;base64,/, "")
    result.contentType = item.base64Image.match(
      /[^:]\w+\/[\w-+\d.]+(?=;|,)/,
    )?.[0]
    result.body = Buffer.from(body, "base64")
  } else {
    if (item.extname) {
      result.contentType = mime.getType(item.extname)!
    }
    result.body = item.buffer
  }

  return result
}
