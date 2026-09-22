import {
  createContext,
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  interventions,
  lessons,
  materials,
  missions,
  suppliers,
} from "../data/catalog";
import { sound } from "../services/audio";

export const AppContext = createContext(null);

const STORAGE_PREFIX = "bi:";

const seedProjects = [
  {
    id: 1,
    name: "Bamboo Packaging Pilot",
    owner: "Operations",
    status: "In progress",
    progress: 33,
    due: "2026-10-25",
    tasks: [
      { id: 11, title: "Approve specification", done: true },
      { id: 12, title: "Run barrier test", done: false },
      { id: 13, title: "Launch pilot", done: false },
    ],
  },
];

function readStoredValue(key, fallback) {
  try {
    const storedValue = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return storedValue ? JSON.parse(storedValue) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() =>
    readStoredValue(key, initialValue)
  );

  const updateValue = useCallback(
    (nextValueOrUpdater) => {
      setValue((currentValue) => {
        const nextValue =
          typeof nextValueOrUpdater === "function"
            ? nextValueOrUpdater(currentValue)
            : nextValueOrUpdater;

        localStorage.setItem(
          `${STORAGE_PREFIX}${key}`,
          JSON.stringify(nextValue)
        );

        return nextValue;
      });
    },
    [key]
  );

  return [value, updateValue];
}

export function AppProvider({ children }) {
  const [actions, setActions] = usePersistentState("actions", []);
  const [scenarios, setScenarios] = usePersistentState("scenarios", []);
  const [projects, setProjects] = usePersistentState(
    "projects",
    seedProjects
  );
  const [shortlist, setShortlist] = usePersistentState("shortlist", []);
  const [readLessons, setReadLessons] = usePersistentState("lessons", []);
  const [notifications, setNotifications] = usePersistentState("notes", []);
  const [prefs, setPrefs] = usePersistentState("prefs", {
    sound: true,
    volume: 0.2,
    reducedMotion: false,
    theme: "light",
    music: true,
    musicVolume: 0.08,
  });

  const total = useMemo(
    () => actions.reduce((sum, action) => sum + action.offset, 0),
    [actions]
  );

  const complete = useMemo(
    () => ({
      first: actions.length >= 1,
      three: actions.length >= 3,
      scenario: scenarios.length >= 1,
      project: projects.length >= 2,
      learn: readLessons.length === lessons.length,
      carbon: total >= 100,
    }),
    [actions.length, projects.length, readLessons.length, scenarios.length, total]
  );

  const xp = useMemo(() => {
    const actionXp = actions.reduce(
      (sum, action) => sum + (action.xp || 0),
      0
    );

    const missionXp = missions.reduce(
      (sum, mission) =>
        sum + (complete[mission.id] ? mission.xp : 0),
      0
    );

    return actionXp + missionXp;
  }, [actions, complete]);

  const rank =
    xp >= 800
      ? "Regenerative Systems Lead"
      : xp >= 500
        ? "Bamboo Strategist"
        : xp >= 300
          ? "Circularity Builder"
          : xp >= 120
            ? "Impact Scout"
            : "Seedling Analyst";

  const notify = useCallback(
    (title, type = "success") => {
      const notification = {
        id: Date.now(),
        title,
        type,
        read: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((current) =>
        [notification, ...current].slice(0, 30)
      );

      sound(type === "success" ? "success" : type, prefs.sound, prefs.volume);
    },
    [prefs.sound, prefs.volume, setNotifications]
  );

  const addAction = useCallback(
    (action) => {
      const savedAction = {
        ...action,
        id: Date.now(),
        date: new Date().toISOString(),
      };

      setActions((current) => [savedAction, ...current]);
      notify("Impact action recorded");
    },
    [notify, setActions]
  );

  const saveScenario = useCallback(
    (scenario) => {
      const savedScenario = {
        ...scenario,
        id: Date.now(),
      };

      setScenarios((current) => [savedScenario, ...current]);
      notify("Scenario saved");
    },
    [notify, setScenarios]
  );

  const deleteScenario = useCallback(
    (id) => {
      setScenarios((current) =>
        current.filter((scenario) => scenario.id !== id)
      );
    },
    [setScenarios]
  );

  const addProject = useCallback(
    (project) => {
      const savedProject = {
        ...project,
        id: Date.now(),
        progress: 0,
        status: "Planned",
        tasks: [],
      };

      setProjects((current) => [savedProject, ...current]);
      notify("Project created");
    },
    [notify, setProjects]
  );

  const updateProject = useCallback(
    (project) => {
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id ? project : item
        )
      );
    },
    [setProjects]
  );

  const deleteProject = useCallback(
    (id) => {
      setProjects((current) =>
        current.filter((project) => project.id !== id)
      );
    },
    [setProjects]
  );

  const toggleSupplier = useCallback(
    (id) => {
      setShortlist((current) =>
        current.includes(id)
          ? current.filter((supplierId) => supplierId !== id)
          : [...current, id]
      );

      sound("click", prefs.sound, prefs.volume);
    },
    [prefs.sound, prefs.volume, setShortlist]
  );

  const readLesson = useCallback(
    (id) => {
      if (readLessons.includes(id)) {
        return;
      }

      setReadLessons((current) => [...current, id]);
      notify("Lesson completed");
    },
    [notify, readLessons, setReadLessons]
  );

  const readAllNotifications = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
      }))
    );
  }, [setNotifications]);

  const value = useMemo(
    () => ({
      materials,
      suppliers,
      lessons,
      interventions,
      missions,
      actions,
      scenarios,
      projects,
      shortlist,
      readLessons,
      notifications,
      prefs,
      total,
      complete,
      xp,
      rank,
      setPrefs,
      addAction,
      saveScenario,
      deleteScenario,
      addProject,
      updateProject,
      deleteProject,
      toggleSupplier,
      readLesson,
      readAllNotifications,
      notify,
    }),
    [
      actions,
      addAction,
      addProject,
      complete,
      deleteProject,
      deleteScenario,
      notifications,
      notify,
      prefs,
      projects,
      rank,
      readAllNotifications,
      readLesson,
      readLessons,
      saveScenario,
      scenarios,
      setPrefs,
      shortlist,
      toggleSupplier,
      total,
      updateProject,
      xp,
    ]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}
