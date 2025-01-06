import { IPicGo, IPluginConfig, IImgInfo } from 'picgo'
import { getPluginConfig, loadUserConfig } from './config'
import uploader, { IUploadResult } from './uploader'

const pluginName = 'r2'

const upload = async (ctx: IPicGo) => {
  const userConfig = loadUserConfig(ctx)
  const client = uploader.createS3Client(userConfig)
  const output = ctx.output

  const tasks = output.map((item, idx) => {

    return uploader.createUploadTask({
      ctx,
      client,
      userConfig,
      item,
      index: idx
    })
  })

  let results: IUploadResult[]

  try {
    results = await Promise.all(tasks)
  } catch (err) {
    ctx.log.error("上传失败，请检查网络连接和配置")
    throw err
  }

  for (const result of results) {
    const { index, url, key, error } = result
    delete output[index].buffer
    delete output[index].base64Image
    output[index].uploadPath = key
    if (error) {
      output[index].error = error
    } else {
      output[index].url = url
      output[index].imgUrl = url
    }
  }

  return ctx
}

const remove = async (ctx: IPicGo, files, guiApi) => {
  const userConfig = loadUserConfig(ctx)
  const client = uploader.createS3Client(userConfig)

  const tasks = files.filter((item) => {
    const { type, imgUrl, fileName } = item
    return type === pluginName && imgUrl && fileName
  }).map((item, idx) => {
    return uploader.createRemoveTask({
      ctx,
      client,
      userConfig,
      item,
      index: idx
    })
  })

  let results: IUploadResult[]

  try {
    results = await Promise.all(tasks)
  } catch (err) {
    ctx.log.error("删除失败，请检查网络连接和配置")
    throw err
  }
  return results
}


const config = (ctx: IPicGo): IPluginConfig[] => {
  return getPluginConfig(ctx)
}


export = (ctx: IPicGo) => {
  const register = (ctx: IPicGo) => {
    ctx.helper.uploader.register(pluginName, {
      handle: upload,
      config,
      name: 'Cloudflare R2',
    })

    ctx.on('remove', (files, guiApi) => {
      remove(ctx, files, guiApi)
    })
  }

  return {
    register
  }
}
