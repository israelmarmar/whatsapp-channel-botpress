const stringToUuid = (str) => {
    str = str.replace('-', '')
    return 'xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx'.replace(/[x]/g, function(c, p) {
      return str[p % str.length]
    })
}

module.exports = stringToUuid;