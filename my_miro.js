
var tag_id_to_num

updateTagIdToNum = async () => {
  let items = await window.miro.board.get()

  tag_id_to_num = {}
  for(let item of items) {
    if (item.type == "tag" && item.title.match(/^\d+$/)) {
      tag_id_to_num[item.id] = parseInt(item.title)
    }
  }
}

searchItems = async (params) => {
  let items = await miro.board.get()
  let result = []
  for(let item of items) {
    let ok = true
    for(let [key, value] of Object.entries(params)) {
      if(!item[key] || item[key] == '' || !item[key].match(new RegExp(value))) {
        ok = false
      }
    }
    if(ok) {
      result.push(item)
    }
  }
  return result
}

contentToLines = (content) => {
  return content.replace(/^<p>|<\/p>$/g, "").split("</p><p>")
}

calcItemPoint = (item) => {
  if (!item.tagIds) return 0
  return item.tagIds.reduce((v, tag_id) => v + (tag_id_to_num[tag_id] || 0), 0)
}

calcItemsPoint = (items) => {
  if (!items) return 0
  return items.reduce((v, item) => v + calcItemPoint(item), 0)
}

createStickyNote = async (content) => {
  let vp = await window.miro.board.viewport.get()

  return await miro.board.createStickyNote({
    content: content,
    x: vp.x + vp.width / 2,
    y: vp.y + vp.height / 2,
  })
}

calcSelectedItemsPoint = async () => {
  await updateTagIdToNum()
  let selected_items = await window.miro.board.getSelection()
  if (!selected_items) return 0
  return calcItemsPoint(selected_items)
}

const TARGET_PANNEL_CLASS = ".boxPanel-pm1ha"

appendPannelBtn = (btn) => {
  let target = document.querySelector(TARGET_PANNEL_CLASS)
  if (target) {
    let div = document.createElement("div")
    div.dataset.id = "calculate"
    div.className = "boardBar__item-zQ-vx item-2ermV"
    div.appendChild(btn)
    
    target.appendChild(div)
  }
}

createPannelBtn = () => {
  let btn = document.createElement("button")
  btn.setAttribute("aria-label", "選択中のアイテムの合計ポイントを計算する")
  btn.setAttribute("aria-haspopup", "true")
  btn.className = "icon-17btk icon_xx-large-Wqvtm icon_default-3EH8F"
  btn.type = "button"
  return btn
}

createSumBtn = () => {
  const btn = createPannelBtn()
  btn.id = "mymiro-sum-btn"
  btn.appendChild(createGoogleIcon("functions"))

  btn.addEventListener("click", () => {
    calcSelectedItemsPoint().then((point) => {
      // createStickyNote("").then((note) => {
      //   let count = 10
      //   let i = 0
      //   let timer
      //   timer = setInterval(() => {
      //     if (i > count) {
      //       note.content = `${point}`
      //       note.sync()
      //       clearInterval(timer)
      //       return
      //     }
      //     note.content = `${Math.floor(Math.random() * 100)}`
      //     note.sync()
      //     i++
      //   }, 150)
      // })
      createStickyNote(`${point}`)
    })
  })
  return btn
}

const SUBTITLE_REGEX = /^# /

createCards = async () => {
  const targets = await window.miro.board.getSelection()
  
  for(let target of targets) {
    if (!target.title || !target.title.match(/createCard/)) continue

    let subtitle = ""
    let y = target.y + target.height

    const lines = contentToLines(target.description)
    for(let line of lines) {

      if (line.match(SUBTITLE_REGEX)) {
        subtitle = line.replace(SUBTITLE_REGEX, "")
        continue
      }
      
      let title = subtitle.length > 0 ? `【${subtitle}】\n${line}` : line

      let new_card = await miro.board.createCard({
        title: title,
        x: target.x,
        y: y,
      })

      y += new_card.height
    }
  }
}

createCreateCardsBtn = () => {
  const btn = createPannelBtn()
  btn.id = "mymiro-create-btn"
  btn.appendChild(createGoogleIcon("dns"))

  btn.addEventListener("click", createCards)
  return btn
}

confirmExistance = (element, settle_fnc) => {
  const target_id = element.id
  if (target_id) {
    let timer
    timer = setInterval(() => {
      if (!document.getElementById(target_id)) {
        settle_fnc(element)
      }
    }, 3000)
  }
}

createGoogleIconLink = () => {
  let link = document.createElement("link")
  link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0"
  link.rel = "stylesheet"
  link.id = "mymiro-google-icon-link"

  return link
}

createGoogleIcon = (name) => {
  const span = document.createElement("span")
  span.className = "material-symbols-outlined"
  span.textContent = name
  return span
}

window.addEventListener("load", (event) => {  
  
  initialize = () => {
    const sum_btn = createSumBtn()
    confirmExistance(sum_btn, appendPannelBtn)

    const create_btn = createCreateCardsBtn()
    confirmExistance(create_btn, appendPannelBtn)

    const link = createGoogleIconLink()
    confirmExistance(link, (link) => {
      let head = document.getElementsByTagName("head")[0]
      if (head) {
        head.appendChild(link)
      }
    })
  }

  initialize()
})