class AIController {
    constructor() {
        this.apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
        this.apiKey = '8cd1d8a4-9a9e-4237-90e7-8fd75ea0fdbd';
        // this.model = 'doubao-seed-1-6-flash-250615';
        this.model = 'doubao-seed-1-6-250615';
        this.isProcessing = false;
        this.lastScreenshot = null;
        this.pendingScreenshot = null;
    }

    async getDanmakuFromImage(imageUrl) {
        // 缩放图片到960x540
        const resizedImageUrl = await this.resizeImage(imageUrl, 960, 540);
        const requestData = {
            model: this.model,
            messages: [
                {
                    content: [
                        {
                            text: `你是一个模拟中文直播聊天室的AI。
                            观看屏幕录像，并生成 20 条简短（60 个字符以内）、现实、符合对话语气的聊天消息，模拟观众可能针对当前看到的内容发表的评论。
                            保持消息简短（60 字符以内），口语化，且语气多样化。
                            在合适的地方使用现代聊天用语，如典，笑，急，乐，赢，绷，牛逼等。
                            包含问题、反应和观察，就像真实的聊天消息一样。
                            注意之前的消息和上下文，以保持聊天的连续性。
                            偶尔提及过去的消息和对话。
                            一些观众应具有持续的性格特征、观点和行为模式。
                            如果观众之前提到过特定话题，偶尔让他们跟进这些话题。
                            让一些观众直接回应其他观众之前说过的话。
                            如果之前有观众提问，稍后偶尔让其他观众回答。
                            如果人们对某事感到兴奋或失望，在后续消息中提及它。
                            偶尔让观众认出彼此是之前发过消息的人。
                            同时为每条消息生成唯一的用户名。
                            尽可能生成独特的用户名——避免常见或过度使用的例子。
                            直接以JSON格式响应：{"danmaku":[{"username":"用户名1","message":"弹幕内容1"},...]}，不要包含其他任何文本。
                            不要包含任何其他文本，只返回JSON格式。`,
                            type: "text"
                        },
                        {
                            image_url: {
                                url: resizedImageUrl
                            },
                            type: "image_url"
                        }
                    ],
                    role: "user"
                }
            ]
        };
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestData)
        });
        if (!response.ok) {
            throw new Error('API请求失败: ' + response.status);
        }
        const result = await response.json();
        if (result.choices && result.choices.length > 0) {
            let content = result.choices[0].message.content;
            let danmakuData;
            try {
                danmakuData = JSON.parse(content);
            } catch (e) {
                throw new Error('AI返回格式错误');
            }
            if (danmakuData.danmaku && Array.isArray(danmakuData.danmaku)) {
                return danmakuData.danmaku;
            } else {
                throw new Error('弹幕数据格式错误');
            }
        } else {
            throw new Error('API返回结果格式异常');
        }
    }

    resizeImage(imageUrl, targetWidth, targetHeight) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.8);
                resolve(resizedImageUrl);
            };
            img.onerror = () => {
                resolve(imageUrl);
            };
            img.src = imageUrl;
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.aiController = new AIController();
});
