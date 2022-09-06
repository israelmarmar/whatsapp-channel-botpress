const stringToUuid = (str: string) => {
    str = str.replace('-', '')
    return 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c, p) {
      return str[p % str.length]
    })
}

export default stringToUuid;