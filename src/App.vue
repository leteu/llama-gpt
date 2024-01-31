<template>
  <div class="chat-container">
    <div ref="scrollArea">
      <template
        v-for="({ ask, answer }, index) in qnaList"
        :key="`qna-box-${index}`"
      >
        <div class="chatbox">
          <h1 class="chatbox__type">Q.</h1>
          <div class="chatbox__content" v-html="getMarkdown(ask)"></div>
        </div>
        <div class="chatbox">
          <h1 class="chatbox__type">A.</h1>
          <div class="chatbox__content" v-html="getMarkdown(answer)"></div>
        </div>
      </template>
    </div>
    <form class="chatform">
      <textarea v-model="askInput" @keydown.enter.prevent="onSubmit" />
      <button @click="onSubmit">전송</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const scrollArea = ref<HTMLDivElement>()

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const a = hljs.highlightAuto(code, [lang, 'plaintext']).value

      console.log(a)

      return a
    }
  })
)

marked.setOptions({
  gfm: true,
  breaks: true,
})

const askInput = ref('')
const qnaList = ref<{ ask: string; answer: string }[]>([
  // {
  //   ask: 'hot to make const variable in javascript',
  //   answer: " In JavaScript, you can declare a constant variable by using the `const` keyword before the variable name. округу You cannot reassign a value to a constant variable after it has been declared. Here is an example:\n```\nconst myConst = 5; // This will throw an error if you try to reassign it\nmyConst = 10; // This will throw an error\n\nconst myOtherConst = 'hello'; // This will not throw an error if you try to reassign it\nmyOtherConst = 'world';\n```\nYou can also use the `let` and `var` keywords to declare variables with different levels of scope. Here is an example:\n```\nlet myVar = 5; // This variable has block-level scope, meaning it is only accessible within the current block of code.\nmyVar = 10; // This will update the value of myVar to 10\n\nvar myOtherVar = 'hello'; // This variable has function-level scope, meaning it is accessible from anywhere in the function.\nmyOtherVar = 'world'; // This will update the value of myOtherVar to 'world'\n```\nIt's important to note that you cannot reassign a constant variable, but you can use a different variable name to create a new non-constant variable with the same value. For example:\n```\nconst myConst = 5;\nmyNewVar = 5; // This will not throw an error, and will create a new non-constant variable named myNewVar with the value 5\n```"
  // }
])

async function readAllChunks(readableStream: ReadableStream) {
  const reader = readableStream.getReader()
  const chunks: Uint8Array[] = []

  let done
  let value
  while (!done) {
    ;({ value, done } = await reader.read())

    try {
      const parseObj = JSON.parse(new TextDecoder().decode(value))

      if (done || parseObj.done) {
        return chunks
      }

      qnaList.value[qnaList.value.length - 1].answer += parseObj.response
      chunks.push(value)
      scrollArea.value?.scroll({ top: scrollArea.value.scrollHeight })
    } catch (e) {
      await Promise.all(
        new TextDecoder()
        .decode(value)
        .split('}\n')
        .map((el, index, arr) => {
          return new Promise<void | Uint8Array[]>((res) => {
            if (!el.trim()) res()

            if (index !== arr.length - 1) {
              el = el + '}'
            }

            const parseObj = JSON.parse(el)

            if (parseObj.done) res(chunks)

            qnaList.value[qnaList.value.length - 1].answer += parseObj.response
            scrollArea.value?.scroll({ top: scrollArea.value.scrollHeight })
            res()
          })
        })
      )
      chunks.push(value)
    }
  }
}

const onSubmit = async (e: KeyboardEvent | MouseEvent) => {
  if ((e as KeyboardEvent).key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
    askInput.value += '\n'
    return
  }

  if (!askInput.value.trim()) return

  qnaList.value.push({ ask: askInput.value, answer: '' })
  askInput.value = ''
  const result = await fetch(
    `http://localhost:4000/llama?prompt=${
      encodeURIComponent(qnaList.value[qnaList.value.length - 1].ask.replace(/^[\u200B|\u200C|\u200D|\u200E|\u200F|\uFEFF]/, ''))
    }`
  )

  await readAllChunks(result.body!)
}

const getMarkdown = (contents: string) => {
  return marked.parse(contents.replace(/^[\u200B|\u200C|\u200D|\u200E|\u200F|\uFEFF]/, ''))
}
</script>

<style lang="sass">
.chat-container
  width: 800px
  height: calc(100vh - 32px)
  margin: 16px auto
  padding: 16px
  display: flex
  flex-direction: column
  box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.1)
  > div:first-child
    flex: 1
    overflow: auto

.chatbox
  display: flex
  width: 100%
  margin-bottom: 8px
  &__type
    width: 75px
    position: relative
    &::after
      content: ''
      position: absolute
      right: 20px
      top: 0
      background: #ccc
      width: 5px
      border-radius: 2.5px
      height: 100%
      margin: 4px 0
  &__content
    width: calc(100% - 75px)
    display: flex
    flex-direction: column
    padding: 8px
    height: auto
    min-height: 0
    max-height: 100%

.chatform
  border: 1px solid #ccc
  border-radius: 5px
  display: flex
  flex-direction: row
  overflow: hidden
  margin-top: 24px
  textarea
    width: 100%
    padding: 10px
    border: none
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.2)
  button
    width: 100px
    padding: 10px
    border: none
    background-color: #4CAF50
    color: white
    cursor: pointer
    &:hover
      background-color: #3e8e41
</style>
