(function () {
  const stages = [
    {
      key: "early",
      title: "商周",
      era: "礼俗初现",
      text: "驱疫祈福的礼俗源流在暗场中浮现，傩由祭仪、巫祝和秩序感开始生成。",
      tags: ["驱疫祈福", "礼俗源流", "巫仪秩序"],
      activeNodes: [0],
      currentNode: 0
    },
    {
      key: "early",
      title: "汉唐",
      era: "表演萌芽",
      text: "队列、扮演和动作程式逐渐清晰，傩从仪式行为转向可观看的表演形态。",
      tags: ["队列", "扮演", "表演萌芽"],
      activeNodes: [0, 1],
      currentNode: 1
    },
    {
      key: "song",
      title: "宋代",
      era: "图像铁证",
      text: "宋代城市经济活跃，傩戏融入民俗节庆并呈现明显戏剧化特征。点击画卷热点可查看细节线索。",
      tags: ["大傩图", "城市节庆", "戏剧化"],
      activeNodes: [0, 1, 2],
      currentNode: 2
    },
    {
      key: "mingqing",
      title: "明清",
      era: "物质定型",
      text: "地方傩戏成熟，大量傩面具实体被保留和流传，角色形象与程式特征稳固延续至现代。",
      tags: ["面具实体", "角色程式", "形象延续"],
      activeNodes: [0, 1, 2, 3],
      currentNode: 3
    },
    {
      key: "modern",
      title: "现代",
      era: "非遗保护",
      text: "现代傩戏进入非遗保护阶段。地域隔离孕育出不同流派，这些差异集中体现在面具形象上。",
      tags: ["非遗保护", "地域流派", "八相傩面"],
      activeNodes: [0, 1, 2, 3, 4],
      currentNode: 4
    }
  ];

  const regionCopy = {
    guizhou: {
      name: "贵州",
      title: "贵州傩堂戏谱系",
      text: "师徒传承、村社仪式和法事系统交织，面具多呈现强烈的镇邪、开路与护佑力量。",
      masks: ["guizhou-kaishan-mangjiang", "guizhou-xianfeng-xiaojie", "guizhou-huoshen-lingguan"]
    },
    jiangxi: {
      name: "江西南丰",
      title: "江西南丰傩舞",
      text: "南丰傩舞强调神灵角色、驱邪镇祟与地方节庆，面具神性和戏剧化特征鲜明。",
      masks: ["jiangxi-leigong", "jiangxi-yinjiao"]
    },
    anhui: {
      name: "安徽",
      title: "安徽地域支系",
      text: "安徽相关傩戏支系提示地域传播的复杂路径，当前作为地图传承节点保留。",
      masks: []
    },
    zhejiang: {
      name: "浙江东阳",
      title: "浙江东阳人物角色",
      text: "东阳傩戏保留地方人物角色与戏剧化特征，连接世俗表演和仪式场域。",
      masks: ["zhejiang-liuchoupo"]
    },
    hubei: {
      name: "湖北恩施",
      title: "湖北恩施地方神祇",
      text: "地方守护神信仰、乡土仪式和村社秩序在面具形象中沉淀。",
      masks: ["hubei-chenghuang-tudi"]
    },
    hebei: {
      name: "河北武安",
      title: "河北武安赛戏传统",
      text: "武安傩戏与赛戏传统中的民间人物形象，体现北方地域支系差异。",
      masks: ["hebei-datou-heshang"]
    }
  };

  const hotspotText = [
    "宋代城市经济活跃，傩戏融入民俗节庆，戏剧化特征明显。",
    "画面中的队列、装扮和动作，提示傩仪已具备可观看、可表演的形态。",
    "图像资料让后续的面具、手势、法器与音乐拥有可追溯的视觉线索。"
  ];

  let stageIndex = 0;
  let modernImageVisible = false;
  let activeMaskId = "guizhou-kaishan-mangjiang";
  const visitedRegions = new Set();

  const els = {
    board: document.getElementById("originBoard"),
    prev: document.getElementById("originPrev"),
    nextStage: document.getElementById("originNextStage"),
    next: document.getElementById("originNext"),
    controlTitle: document.getElementById("originControlTitle"),
    text: document.getElementById("originStageText"),
    stageTags: document.getElementById("originStageTags"),
    scrollView: document.getElementById("originScrollView"),
    bubble: document.getElementById("scrollBubble"),
    compare: document.getElementById("maskCompare"),
    compareToggle: document.getElementById("compareToggle"),
    regionPanel: document.getElementById("regionPanel"),
    regionMasks: document.getElementById("originRegionMasks"),
    finalCallout: document.getElementById("originFinalCallout"),
    maskFocusRegion: document.getElementById("maskFocusRegion"),
    maskFocusImage: document.getElementById("maskFocusImage"),
    maskFocusName: document.getElementById("maskFocusName"),
    maskFocusRole: document.getElementById("maskFocusRole")
  };

  if (!els.board) return;

  function renderTags(tags) {
    if (!els.stageTags) return;
    els.stageTags.innerHTML = tags.map((tag) => `<span>${tag}</span>`).join("");
  }

  function setStage(index) {
    stageIndex = Math.max(0, Math.min(stages.length - 1, index));
    const stage = stages[stageIndex];

    els.board.dataset.stage = String(stageIndex);
    els.board.dataset.scene = stage.key;
    els.controlTitle.textContent = `${stage.title} · ${stage.era}`;
    els.text.textContent = stage.text;
    renderTags(stage.tags);

    document.querySelectorAll(".origin-scene").forEach((scene) => {
      scene.classList.toggle("is-active", scene.dataset.scene === stage.key);
    });
    document.querySelectorAll(".origin-node").forEach((node) => {
      const nodeIndex = Number(node.dataset.node);
      node.classList.toggle("is-lit", stage.activeNodes.includes(nodeIndex));
      node.classList.toggle("is-current", nodeIndex === stage.currentNode);
    });

    els.prev.disabled = stageIndex === 0;
    els.nextStage.disabled = stageIndex === stages.length - 1;
    els.compareToggle.classList.toggle("is-ready", stage.key === "mingqing");
    closeHotspot();
    NuoAudio.playTone(180 + stageIndex * 36, 0.14, "triangle");
  }

  function closeHotspot() {
    els.scrollView?.classList.remove("is-zoomed", "zoom-a", "zoom-b", "zoom-c");
    if (els.bubble) {
      els.bubble.classList.remove("is-visible");
      els.bubble.textContent = "";
    }
  }

  function openHotspot(index) {
    closeHotspot();
    els.scrollView.classList.add("is-zoomed", ["zoom-a", "zoom-b", "zoom-c"][index]);
    els.bubble.textContent = hotspotText[index];
    els.bubble.classList.add("is-visible");
    NuoAudio.playTone(250 + index * 32, 0.16, "triangle");
  }

  function toggleCompare() {
    if (stages[stageIndex].key !== "mingqing") {
      setStage(3);
    }
    modernImageVisible = !modernImageVisible;
    els.compare.classList.toggle("show-modern", modernImageVisible);
    els.compareToggle.textContent = modernImageVisible ? "今 / 古" : "古 / 今";
    NuoAudio.playTone(modernImageVisible ? 310 : 210, 0.16, "triangle");
  }

  function maskImage(mask) {
    return NuoRouter.asset(mask.image || `assets/images/masks/${mask.id}.png`);
  }

  function updateMaskFocus(mask) {
    if (!mask) return;
    activeMaskId = mask.id;
    els.maskFocusRegion.textContent = mask.region;
    els.maskFocusImage.src = maskImage(mask);
    els.maskFocusImage.alt = `${mask.name}面具`;
    els.maskFocusName.textContent = mask.name;
    els.maskFocusRole.textContent = mask.meaning || mask.role || "地域仪式角色";
    NuoState.setSelectedMask(mask);
  }

  function renderRegionMasks(region) {
    els.regionMasks = document.getElementById("originRegionMasks");
    if (!els.regionMasks) return;

    if (!region.masks.length) {
      els.regionMasks.innerHTML = `
        <div class="mini-mask is-note">
          <strong>地域支系节点</strong>
          <span>当前八相面具暂未配置安徽代表角色</span>
        </div>
      `;
      return;
    }

    if (!region.masks.includes(activeMaskId)) {
      activeMaskId = region.masks[0];
    }

    const masks = region.masks.map((id) => NuoApp.maskById(id)).filter(Boolean);
    els.regionMasks.innerHTML = masks.map((mask) => `
      <button class="mini-mask${mask.id === activeMaskId ? " is-active" : ""}" type="button" data-mask-id="${mask.id}">
        <img src="${maskImage(mask)}" alt="${mask.name}面具" onerror="NuoApp.imageFallback(this)" />
        <strong>${mask.name}</strong>
        <span>${mask.region}</span>
      </button>
    `).join("");

    els.regionMasks.querySelectorAll("[data-mask-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const mask = NuoApp.maskById(button.dataset.maskId);
        updateMaskFocus(mask);
        renderRegionMasks(region);
        NuoAudio.playTone(260, 0.12, "triangle");
      });
    });

    updateMaskFocus(masks.find((mask) => mask.id === activeMaskId) || masks[0]);
  }

  function selectRegion(regionId) {
    const region = regionCopy[regionId];
    if (!region) return;

    visitedRegions.add(regionId);
    document.querySelectorAll("[data-region]").forEach((item) => {
      item.classList.toggle("is-selected", item.dataset.region === regionId);
    });

    els.regionPanel.innerHTML = `
      <span class="info-label">地域信息</span>
      <h3>${region.title}</h3>
      <p>${region.text}</p>
      <div class="origin-region-masks" id="originRegionMasks"></div>
    `;
    renderRegionMasks(region);

    if (visitedRegions.size >= 2) {
      els.finalCallout.classList.add("is-visible");
      els.next.classList.add("primary");
      NuoState.markComplete("completedOrigin");
    }
    NuoAudio.playTone(220, 0.14, "triangle");
  }

  els.prev.addEventListener("click", () => setStage(stageIndex - 1));
  els.nextStage.addEventListener("click", () => setStage(stageIndex + 1));
  els.next.addEventListener("click", () => NuoState.markComplete("completedOrigin"));
  els.compareToggle.addEventListener("click", toggleCompare);

  document.querySelectorAll(".origin-node").forEach((button) => {
    button.addEventListener("click", () => setStage(Number(button.dataset.node)));
  });
  document.querySelectorAll(".scroll-hotspot").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openHotspot(Number(button.dataset.hotspot));
    });
  });
  els.scrollView?.addEventListener("click", (event) => {
    if (!event.target.classList.contains("scroll-hotspot")) closeHotspot();
  });
  document.querySelectorAll(".map-region, .map-label").forEach((item) => {
    item.addEventListener("click", () => {
      if (stages[stageIndex].key !== "modern") setStage(4);
      selectRegion(item.dataset.region);
    });
  });

  selectRegion("guizhou");
  setStage(0);
})();
