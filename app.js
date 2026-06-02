const DATA = {

"林姿彤": {
    title: "🟦 COMPANY INTRODUCTION FLOW",
    steps: [
        {
            step: "Step 1",
            title: "Define Company Identity",
            task: "确定公司名称、行业、定位",
            output: "Company name + Industry + Positioning"
        },
        {
            step: "Step 2",
            title: "Build Business Model",
            task: "定义B2B / B2C / Platform 模式",
            output: "Business model description"
        },
        {
            step: "Step 3",
            title: "Define Growth Stage",
            task: "说明公司发展阶段（Startup / Growth / Expansion）",
            output: "Stage explanation"
        },
        {
            step: "FINAL OUTPUT",
            title: "Slide + Word",
            task: "PPT Slide 2 + Word 200–300字",
            output: "完整公司介绍页面"
        }
    ]
},

"黄氏翠姮": {
    title: "🟨 FINANCING FLOW",
    steps: [
        {
            step: "Step 1",
            title: "Calculate Funding Need",
            task: "确定融资总金额（必须具体）",
            output: "Exact funding number"
        },
        {
            step: "Step 2",
            title: "Allocate Funds",
            task: "分配资金用途比例（扩张/设备/运营）",
            output: "Funding breakdown (%)"
        },
        {
            step: "Step 3",
            title: "Loan Structure",
            task: "贷款期限 + 利率预期",
            output: "Loan terms"
        },
        {
            step: "FINAL OUTPUT",
            title: "Slide + Word",
            task: "PPT Slide 4 + Word 200–300字",
            output: "融资方案完整页"
        }
    ]
},

"久米秋惠": {
    title: "🟥 RISK ANALYSIS FLOW",
    steps: [
        {
            step: "Step 1",
            title: "Market Risk",
            task: "分析市场竞争与需求变化",
            output: "Market risk list"
        },
        {
            step: "Step 2",
            title: "Financial Risk",
            task: "分析现金流与还款风险",
            output: "Financial risk analysis"
        },
        {
            step: "Step 3",
            title: "Operational Risk",
            task: "执行与成本风险",
            output: "Operational risks"
        },
        {
            step: "FINAL OUTPUT",
            title: "Mitigation Strategy",
            task: "提出解决方案（分阶段贷款/控制成本）",
            output: "Risk mitigation plan + Slide 5"
        }
    ]
},

"岩井优美": {
    title: "🟪 NEGOTIATION FLOW",
    steps: [
        {
            step: "Step 1",
            title: "Bank Expectations",
            task: "分析银行想要什么（利息/安全/客户）",
            output: "Bank benefits list"
        },
        {
            step: "Step 2",
            title: "Company Demands",
            task: "提出降低利率/延长贷款",
            output: "Negotiation demands"
        },
        {
            step: "Step 3",
            title: "Win-Win Strategy",
            task: "设计双方利益平衡方案",
            output: "Win-win structure"
        },
        {
            step: "FINAL OUTPUT",
            title: "Slides + Speech",
            task: "Slide 6–7 + 2 min speech",
            output: "Full negotiation script"
        }
    ]
},

"聂诚忠": {
    title: "🟩 FINAL INTEGRATION FLOW",
    steps: [
        {
            step: "Step 1",
            title: "Collect All Parts",
            task: "收集所有成员内容",
            output: "Full dataset"
        },
        {
            step: "Step 2",
            title: "Check Consistency",
            task: "检查金额/逻辑/结构是否一致",
            output: "Clean unified version"
        },
        {
            step: "Step 3",
            title: "Design PPT",
            task: "统一视觉 + 排版",
            output: "Final PPT design"
        },
        {
            step: "FINAL OUTPUT",
            title: "Submission Package",
            task: "PPT + Word final version",
            output: "Ready to submit project"
        }
    ]
}

};

function autoFill() {
    let name = document.getElementById("name").value;
    let output = document.getElementById("output");

    if (!DATA[name]) {
        output.innerHTML = "";
        return;
    }

    let d = DATA[name];

    let html = `<div class="card"><h2>${d.title}</h2>`;

    d.steps.forEach(s => {
        html += `
        <div class="step">
            <h3>${s.step} — ${s.title}</h3>
            <p>📌 Task: ${s.task}</p>
            <p>📤 Output: ${s.output}</p>
        </div>
        `;
    });

    html += `</div>`;

    output.innerHTML = html;
}
