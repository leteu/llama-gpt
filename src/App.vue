<template>
  <div>
    <template
      v-for="({ ask, answer }, index) in qnaList"
      :key="`qna-box-${index}`"
    >
      <div style="display: flex;">
        <h1>Q.</h1>
        <div style="flex: 1" v-html="getMarkdown(ask)"></div>
      </div>
      <div style="display: flex;">
        <h1>A.</h1>
        <div style="flex: 1" v-html="getMarkdown(answer)"></div>
      </div>
    </template>
  </div>
  <div>
    <textarea v-model="askInput" @keydown.enter.prevent="onSubmit" />
    <button @click="onSubmit">전송</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
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

    const parseObj = JSON.parse(new TextDecoder().decode(value))

    if (done || parseObj.done) {
      return chunks
    }
    qnaList.value[qnaList.value.length - 1].answer += parseObj.response
    chunks.push(value)
  }
}

const onSubmit = async (e: KeyboardEvent | MouseEvent) => {
  if ((e as KeyboardEvent).key === 'Enter' && (e.ctrlKey || e.metaKey)) return

  if (!askInput.value.trim()) return

  qnaList.value.push({ ask: askInput.value, answer: '' })
  askInput.value = ''
  const result = await fetch(
    `http://192.168.0.131:8080/llama?prompt=${
      qnaList.value[qnaList.value.length - 1].ask
    }`
  )

  await readAllChunks(result.body!)
}

const getMarkdown = (contents: string) => {
  return marked.parse(contents.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''))
}
</script>

<style lang="sass"></style>
